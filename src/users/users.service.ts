// src/users/users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, businessId: string) {
    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
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
        businessId: true,
      },
    });

    return user;
  }

  async findAll(businessId: string) {
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

  async findOne(id: string, businessId: string) {
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

    // Validar que el usuario pertenezca al mismo negocio
    if (user.businessId !== businessId) {
      throw new ForbiddenException('No tienes acceso a este usuario');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
    businessId: string,
  ) {
    // Verificar que el usuario a actualizar existe y pertenece al mismo negocio
    const userToUpdate = await this.findOne(id, businessId);

    // No permitir que un usuario se desactive a sí mismo
    if (id === requestingUserId && updateUserDto.active === false) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
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

  async deactivate(id: string, requestingUserId: string, businessId: string) {
    // No permitir que un usuario se desactive a sí mismo
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    // Verificar que el usuario existe y pertenece al mismo negocio
    await this.findOne(id, businessId);

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

  async activate(id: string, requestingUserId: string, businessId: string) {
    // Verificar que el usuario existe y pertenece al mismo negocio
    await this.findOne(id, businessId);

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