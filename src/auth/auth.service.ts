import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { access } from 'fs';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

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
   * Generar token JWT
   */

  generateJwtToken(userId: string, email: string, role: string, businessId: string): string {
    const payload: JwtPayload = { sub: userId, email, role, businessId };
    return this.jwtService.sign(payload);
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
   * Login de usuario
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const token = this.generateJwtToken(
      user.id, 
      user.email, 
      user.role, 
      user.businessId
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
        businessId: user.businessId,
      }
    };
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

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await this.verifyPassword (
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Actualizar la contraseña
    await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
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

    return { message: 'Contraseña reiniciada exitosamente' };
  }
}
