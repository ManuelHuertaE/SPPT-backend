// src/users/users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, role: UserRole, businessId?: string) {
    // Si el que crea es SUPER_ADMIN y está creando un OWNER, businessId puede ser null
    const isCreatingSuperAdminOwner = role === UserRole.SUPER_ADMIN && createUserDto.role === UserRole.OWNER;

    // Para todos los demás casos, se requiere businessId
    if (!isCreatingSuperAdminOwner && !businessId) {
      throw new ForbiddenException('Debes crear un negocio antes de agregar usuarios');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, this.SALT_ROUNDS);

    // Si el que crea es SUPER_ADMIN y está creando un OWNER, businessId es null
    // En todos los demás casos, se usa el businessId del creador
    const userBusinessId = isCreatingSuperAdminOwner ? null : businessId;

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        businessId: userBusinessId,
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
      },
    });

    return user;
  }

  async findAll(role: UserRole, businessId?: string) {
    // SUPER_ADMIN ve todos los usuarios
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.user.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // OWNER y EMPLOYEE solo ven usuarios de su negocio
    if (!businessId) {
      throw new ForbiddenException('No tienes un negocio asignado');
    }

    return this.prisma.user.findMany({
      where: {
        businessId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, role: UserRole, businessId?: string) {
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
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // SUPER_ADMIN puede ver cualquier usuario
    if (role === UserRole.SUPER_ADMIN) {
      return user;
    }

    // OWNER y EMPLOYEE solo pueden ver usuarios de su negocio
    if (user.businessId !== businessId) {
      throw new ForbiddenException('No tienes acceso a este usuario');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
    role: UserRole,
    businessId?: string,
  ) {
    // Verificar que el usuario a actualizar existe
    const userToUpdate = await this.findOne(id, role, businessId);

    // No permitir que un usuario se desactive a sí mismo
    if (id === requestingUserId && updateUserDto.active === false) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    // Si es OWNER, validar que solo actualice usuarios de su negocio
    if (role === UserRole.OWNER && userToUpdate.businessId !== businessId) {
      throw new ForbiddenException('Solo puedes actualizar usuarios de tu negocio');
    }

    const updatedUser = await this.prisma.user.update({
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

    return updatedUser;
  }

  async deactivate(id: string, requestingUserId: string, role: UserRole, businessId?: string) {
    // No permitir que un usuario se desactive a sí mismo
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    // Verificar que el usuario existe
    await this.findOne(id, role, businessId);

    const user = await this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
      },
    });

    return {
      message: 'Usuario desactivado exitosamente',
      user,
    };
  }

  async activate(id: string, requestingUserId: string, role: UserRole, businessId?: string) {
    // Verificar que el usuario existe
    await this.findOne(id, role, businessId);

    const user = await this.prisma.user.update({
      where: { id },
      data: { active: true },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        active: true,
      },
    });

    return {
      message: 'Usuario activado exitosamente',
      user,
    };
  }
}