import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 días

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Hashear contraseña usando bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verificar contraseña usando bcrypt
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generar access token JWT
   */
  generateAccessToken(userId: string, email: string, role: string, businessId?: string): string {
    const payload: JwtPayload = { 
      sub: userId, 
      email, 
      role, 
      businessId: businessId || undefined 
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Generar refresh token único
   */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Guardar refresh token en la base de datos
   */
  async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    return this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Validar credenciales del usuario
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        business: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Login de usuario - Genera access token y refresh token
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const accessToken = this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.businessId ?? undefined,
    );

    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
        businessId: user.businessId,
      },
    };
  }

  /**
   * Refrescar access token usando refresh token
   */
  async refreshAccessToken(refreshTokenString: string) {
    // Buscar el refresh token en la BD
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: {
        user: {
          include: {
            business: true,
          },
        },
      },
    });

    // Validar que el refresh token existe
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Validar que no esté revocado
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    // Validar que no haya expirado
    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Validar que el usuario esté activo
    if (!refreshToken.user.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Generar nuevo access token con datos actualizados del usuario
    const accessToken = this.generateAccessToken(
      refreshToken.user.id,
      refreshToken.user.email,
      refreshToken.user.role,
      refreshToken.user.businessId ?? undefined, // 👈 Esto traerá el businessId actualizado
    );

    // Opcionalmente, generar un nuevo refresh token (rotation)
    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(refreshToken.user.id, newRefreshToken);

    // Revocar el refresh token anterior
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: {
        id: refreshToken.user.id,
        email: refreshToken.user.email,
        name: refreshToken.user.name,
        lastName: refreshToken.user.lastName,
        role: refreshToken.user.role,
        businessId: refreshToken.user.businessId,
      },
    };
  }

  /**
   * Logout - Revocar refresh token
   */
  async logout(refreshTokenString: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (!refreshToken) {
      throw new BadRequestException('Refresh token inválido');
    }

    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return { message: 'Logout exitoso' };
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { 
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    return { message: 'Todos los tokens revocados exitosamente' };
  }

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await this.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revocar todos los refresh tokens al cambiar contraseña (seguridad)
    await this.revokeAllUserTokens(userId);

    return { message: 'Contraseña actualizada exitosamente. Por favor, vuelve a iniciar sesión.' };
  }

  /**
   * Reiniciar contraseña (SOLO ADMIN - no necesita contraseña actual)
   */
  async resetPassword(userId: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revocar todos los refresh tokens del usuario
    await this.revokeAllUserTokens(userId);

    return { message: 'Contraseña reiniciada exitosamente' };
  }
}
