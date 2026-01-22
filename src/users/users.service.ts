// src/users/users.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    // Validar permisos según quien crea y qué rol se está creando
    await this.validateUserCreation(role, createUserDto.role, businessId);

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, this.SALT_ROUNDS);

    // Determinar businessId del nuevo usuario
    const userBusinessId = await this.determineBusinessId(role, createUserDto.role, businessId);

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

  /**
   * Validar permisos para crear usuarios según roles
   */
  private async validateUserCreation(creatorRole: UserRole, newUserRole: UserRole, businessId?: string) {
    // SUPER_ADMIN puede crear OWNER sin businessId
    if (creatorRole === UserRole.SUPER_ADMIN && newUserRole === UserRole.OWNER) {
      return; // Permitido
    }

    // Para todos los demás casos, se requiere businessId
    if (!businessId) {
      throw new ForbiddenException('Debes crear un negocio antes de agregar usuarios');
    }

    // Validar según el rol que se está creando
    switch (newUserRole) {
      case UserRole.SUPER_ADMIN:
        throw new ForbiddenException('No puedes crear un SUPER_ADMIN');

      case UserRole.OWNER:
        // Solo SUPER_ADMIN puede crear OWNER
        if (creatorRole !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException('Solo SUPER_ADMIN puede crear OWNER');
        }
        // Validar que no exista otro OWNER en ese negocio
        const existingOwner = await this.prisma.user.findFirst({
          where: { businessId, role: UserRole.OWNER },
        });
        if (existingOwner) {
          throw new BadRequestException('Ya existe un OWNER para este negocio');
        }
        break;

      case UserRole.CO_OWNER:
        // Solo SUPER_ADMIN y OWNER pueden crear CO_OWNER
        if (creatorRole !== UserRole.SUPER_ADMIN && creatorRole !== UserRole.OWNER) {
          throw new ForbiddenException('Solo OWNER puede crear CO_OWNER');
        }
        break;

      case UserRole.EMPLOYEE:
        // SUPER_ADMIN, OWNER y CO_OWNER pueden crear EMPLOYEE
        if (
          creatorRole !== UserRole.SUPER_ADMIN && 
          creatorRole !== UserRole.OWNER && 
          creatorRole !== UserRole.CO_OWNER
        ) {
          throw new ForbiddenException('No tienes permisos para crear EMPLOYEE');
        }
        break;
    }
  }

  /**
   * Determinar el businessId del nuevo usuario
   */
  private async determineBusinessId(
    creatorRole: UserRole, 
    newUserRole: UserRole, 
    businessId?: string
  ): Promise<string | null> {
    // Si SUPER_ADMIN crea OWNER, businessId es null
    if (creatorRole === UserRole.SUPER_ADMIN && newUserRole === UserRole.OWNER) {
      return null;
    }

    // En todos los demás casos, heredan el businessId
    return businessId || null;
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

    // OWNER, CO_OWNER y EMPLOYEE solo ven usuarios de su negocio
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

    // Los demás solo pueden ver usuarios de su negocio
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

    // Validar permisos para actualizar según roles
    await this.validateUserUpdate(role, userToUpdate.role, requestingUserId, id, businessId);

    // No permitir cambiar el rol a través de update (podría crear endpoint separado si es necesario)
    // if (updateUserDto.role) {
    //   throw new ForbiddenException('No puedes cambiar el rol de un usuario a través de este endpoint');
    // }

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

  /**
   * Validar permisos para actualizar usuarios
   */
  private async validateUserUpdate(
    updaterRole: UserRole,
    targetRole: UserRole,
    updaterId: string,
    targetId: string,
    businessId?: string
  ) {
    // SUPER_ADMIN puede actualizar a cualquiera
    if (updaterRole === UserRole.SUPER_ADMIN) {
      return;
    }

    // OWNER puede actualizar CO_OWNER y EMPLOYEE de su negocio
    if (updaterRole === UserRole.OWNER) {
      if (targetRole === UserRole.OWNER && updaterId !== targetId) {
        throw new ForbiddenException('No puedes actualizar a otro OWNER');
      }
      return;
    }

    // CO_OWNER solo puede actualizar EMPLOYEE
    if (updaterRole === UserRole.CO_OWNER) {
      if (targetRole !== UserRole.EMPLOYEE) {
        throw new ForbiddenException('CO_OWNER solo puede actualizar EMPLOYEE');
      }
      return;
    }

    // EMPLOYEE no puede actualizar a nadie
    throw new ForbiddenException('No tienes permisos para actualizar usuarios');
  }

  async deactivate(id: string, requestingUserId: string, role: UserRole, businessId?: string) {
    // No permitir que un usuario se desactive a sí mismo
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    // Verificar que el usuario existe
    const userToDeactivate = await this.findOne(id, role, businessId);

    // Validar permisos para desactivar
    await this.validateUserDeactivation(role, userToDeactivate.role);

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

  /**
   * Validar permisos para desactivar usuarios
   */
  private async validateUserDeactivation(deactivatorRole: UserRole, targetRole: UserRole) {
    // SUPER_ADMIN puede desactivar a cualquiera
    if (deactivatorRole === UserRole.SUPER_ADMIN) {
      return;
    }

    // OWNER puede desactivar CO_OWNER y EMPLOYEE
    if (deactivatorRole === UserRole.OWNER) {
      if (targetRole === UserRole.OWNER) {
        throw new ForbiddenException('No puedes desactivar a otro OWNER');
      }
      return;
    }

    // CO_OWNER solo puede desactivar EMPLOYEE
    if (deactivatorRole === UserRole.CO_OWNER) {
      if (targetRole !== UserRole.EMPLOYEE) {
        throw new ForbiddenException('CO_OWNER solo puede desactivar EMPLOYEE');
      }
      return;
    }

    throw new ForbiddenException('No tienes permisos para desactivar usuarios');
  }

  async activate(id: string, requestingUserId: string, role: UserRole, businessId?: string) {
    // Verificar que el usuario existe
    const userToActivate = await this.findOne(id, role, businessId);

    // Validar permisos (misma lógica que desactivar)
    await this.validateUserDeactivation(role, userToActivate.role);

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

  async getProfile(userId: string){
    const user = await this.prisma.user.findUnique({
      where: { id: userId},
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
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}