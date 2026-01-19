// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService, // Inyectar AuthService
  ) {}

  /**
   * Crear un nuevo usuario (OWNER or EMPLOYEE)
   * Solo administradores (OWNER) pueden crear usuarios
   */
  async create(createUserDto: CreateUserDto, requestingUserId: string) {
    // Verificar que el usuario solicitante sea un OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden crear nuevos usuarios');
    }

    // Verificar que el negocio exista y que el usuario solicitante pertenezca a él
    const business = await this.prisma.business.findUnique({
      where: { id: createUserDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Verificar que el usuario solicitante pertenezca al negocio
    if (requestingUser.businessId !== createUserDto.businessId) {
      throw new ForbiddenException('Solo puedes crear usuarios para tu propio negocio');
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email ya está en uso');
    }

    // Hash contraseña usando AuthService
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        lastName: createUserDto.lastName,
        password: hashedPassword,
        role: createUserDto.role,
        businessId: createUserDto.businessId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Encontrar todos los usuarios de un negocio
   */
  async findAll(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Encontrar un usuario por ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar un usuario (SIN contraseña)
   */
  async update(id: string, updateUserDto: UpdateUserDto, requestingUserId: string) {
    // Verificar que el usuario solicitante sea un OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden actualizar usuarios');
    }

    // Verificar que el usuario exista
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que ambos usuarios pertenezcan al mismo negocio
    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('Solo puedes actualizar usuarios de tu propio negocio');
    }

    // Si se actualiza el email, verificar que no esté en uso
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email ya está en uso');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  /**
   * Desactivar un usuario (eliminación suave)
   */
  async deactivate(id: string, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden desactivar usuarios');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('Solo puedes desactivar usuarios de tu propio negocio'); 
    }

    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivar tu propio usuario');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        active: true,
      },
    });
  }

  /**
   * Activar un usuario
   */
  async activate(id: string, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden activar usuarios');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (requestingUser.businessId !== user.businessId) {
      throw new ForbiddenException('Solo puedes activar usuarios de tu propio negocio');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: true },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        active: true,
      },
    });
  }
}