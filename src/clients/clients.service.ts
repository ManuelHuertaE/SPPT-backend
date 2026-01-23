import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtClientPayload } from './strategies/jwt-client.strategy';
import { randomBytes } from 'crypto';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';

@Injectable()
export class ClientsService {
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 días para clientes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  /**
   * Generar access token JWT para cliente
   */
  generateAccessToken(clientId: string, phone: string, email?: string): string {
    const payload: JwtClientPayload = {
      sub: clientId,
      phone,
      email,
    };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  /**
   * Generar refresh token
   */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Guardar refresh token en la base de datos
   */
  async saveRefreshToken(clientId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    return this.prisma.clientRefreshToken.create({
      data: {
        token,
        clientId,
        expiresAt,
      },
    });
  }

  /**
   * Registrar nuevo cliente (SIN negocio)
   */
  async register(registerDto: RegisterClientDto) {
    const { name, phone, email, password } = registerDto;

    // Verificar si el cliente ya existe
    const existingClient = await this.prisma.client.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingClient) {
      throw new ConflictException('Este teléfono o email ya está registrado');
    }

    // Crear cliente SIN negocio
    const hashedPassword = await this.authService.hashPassword(password);

    const client = await this.prisma.client.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        // 👈 NO crear clientBusinesses aquí
      },
    });

    // Generar tokens
    const accessToken = this.generateAccessToken(
      client.id,
      client.phone,
      client.email ?? undefined,
    );
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(client.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        businesses: [], // 👈 Array vacío al inicio
      },
    };
  }

  /**
   * Login de cliente
   */
  async login(loginDto: LoginClientDto) {
    const { phoneOrEmail, password } = loginDto;

    // Buscar cliente por teléfono o email
    const client = await this.prisma.client.findFirst({
      where: {
        OR: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
      },
      include: {
        clientBusinesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!client) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!client.active) {
      throw new UnauthorizedException('Cliente inactivo');
    }

    if (!client.password) {
      throw new UnauthorizedException(
        'No has configurado una contraseña. Por favor, usa el código QR o contacta al negocio.',
      );
    }

    const isPasswordValid = await this.authService.verifyPassword(password, client.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const accessToken = this.generateAccessToken(
      client.id,
      client.phone,
      client.email ?? undefined,
    );
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(client.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email ?? undefined,
        businesses: client.clientBusinesses.map((cb) => ({
          id: cb.business.id,
          name: cb.business.name,
          currentPoints: cb.currentPoints,
          active: cb.active,
        })),
      },
    };
  }

  /**
   * Registrar cliente en un negocio adicional
   */
  async registerBusiness(clientId: string, registerBusinessDto: RegisterBusinessDto) {
    const { businessId } = registerBusinessDto;

    // Verificar que el negocio existe
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new BadRequestException('Negocio no encontrado');
    }

    // Verificar si ya está registrado
    const existingRelation = await this.prisma.clientBusiness.findUnique({
      where: {
        clientId_businessId: {
          clientId,
          businessId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Ya estás registrado en este negocio');
    }

    // Crear la relación
    const clientBusiness = await this.prisma.clientBusiness.create({
      data: {
        clientId,
        businessId,
      },
      include: {
        business: true,
      },
    });

    return {
      message: 'Registrado exitosamente en el negocio',
      business: {
        id: clientBusiness.business.id,
        name: clientBusiness.business.name,
        currentPoints: clientBusiness.currentPoints,
      },
    };
  }

  /**
   * Obtener todos los negocios del cliente
   */
  async getBusinesses(clientId: string) {
    const clientBusinesses = await this.prisma.clientBusiness.findMany({
      where: { clientId },
      include: {
        business: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      businesses: clientBusinesses.map((cb) => ({
        id: cb.business.id,
        name: cb.business.name,
        currentPoints: cb.currentPoints,
        active: cb.active,
        registeredAt: cb.createdAt,
      })),
    };
  }

  /**
   * Obtener puntos de un negocio específico
   */
  async getBusinessPoints(clientId: string, businessId: string) {
    const clientBusiness = await this.prisma.clientBusiness.findUnique({
      where: {
        clientId_businessId: {
          clientId,
          businessId,
        },
      },
      include: {
        business: true,
        pointMovements: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!clientBusiness) {
      throw new BadRequestException('No estás registrado en este negocio');
    }

    return {
      business: {
        id: clientBusiness.business.id,
        name: clientBusiness.business.name,
      },
      currentPoints: clientBusiness.currentPoints,
      active: clientBusiness.active,
      history: clientBusiness.pointMovements.map((pm) => ({
        id: pm.id,
        points: pm.points,
        type: pm.type,
        reason: pm.reason,
        createdAt: pm.createdAt,
      })),
    };
  }

  /**
   * Refrescar access token
   */
  async refreshAccessToken(refreshTokenString: string) {
    const refreshToken = await this.prisma.clientRefreshToken.findUnique({
      where: { token: refreshTokenString },
      include: {
        client: {
          include: {
            clientBusinesses: {
              include: {
                business: true,
              },
            },
          },
        },
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!refreshToken.client.active) {
      throw new UnauthorizedException('Cliente inactivo');
    }

    // Generar nuevos tokens
    const accessToken = this.generateAccessToken(
      refreshToken.client.id,
      refreshToken.client.phone,
      refreshToken.client.email ?? undefined,
    );
    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(refreshToken.client.id, newRefreshToken);

    // Revocar el anterior
    await this.prisma.clientRefreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      client: {
        id: refreshToken.client.id,
        name: refreshToken.client.name,
        phone: refreshToken.client.phone,
        email: refreshToken.client.email,
        businesses: refreshToken.client.clientBusinesses.map((cb) => ({
          id: cb.business.id,
          name: cb.business.name,
          currentPoints: cb.currentPoints,
        })),
      },
    };
  }

  /**
   * Logout de cliente
   */
  async logout(refreshTokenString: string) {
    const refreshToken = await this.prisma.clientRefreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (!refreshToken) {
      throw new BadRequestException('Refresh token inválido');
    }

    await this.prisma.clientRefreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return { message: 'Logout exitoso' };
  }

  /**
   * Obtener perfil del cliente
   */
  async getProfile(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        clientBusinesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!client) {
      throw new BadRequestException('Cliente no encontrado');
    }

    const { password: _, ...clientData } = client;

    return {
      ...clientData,
      businesses: client.clientBusinesses.map((cb) => ({
        id: cb.business.id,
        name: cb.business.name,
        currentPoints: cb.currentPoints,
        active: cb.active,
      })),
    };
  }
}