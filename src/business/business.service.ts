import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear un nuevo negocio
   * Solo SUPER_ADMIN y OWNER pueden crear negocios
   */
  async create(createBusinessDto: CreateBusinessDto, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.SUPER_ADMIN && requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('No tienes permisos para crear negocios');
    }

    // Si es OWNER y ya tiene un negocio, no puede crear otro
    if (requestingUser.role === UserRole.OWNER && requestingUser.businessId) {
      throw new ForbiddenException('Ya tienes un negocio asignado');
    }

    // Crear negocio
    const business = await this.prisma.business.create({
      data: {
        name: createBusinessDto.name,
        status: createBusinessDto.status || 'ACTIVE',
      },
    });

    // Si es OWNER, asignarle automáticamente el negocio creado
    if (requestingUser.role === UserRole.OWNER) {
      await this.prisma.user.update({
        where: { id: requestingUserId },
        data: { businessId: business.id },
      });
    }

    return business;
  }

  /**
   * Encontrar todos los negocios
   * SUPER_ADMIN: ve todos los negocios
   * OWNER/CO_OWNER/EMPLOYEE: solo ve su propio negocio
   */
  async findAll(role: UserRole, businessId?: string) {
    // SUPER_ADMIN ve todos los negocios
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.business.findMany({
        include: {
          _count: {
            select: {
              users: true,
              clientBusinesses: true,
              products: true,
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // OWNER, CO_OWNER y EMPLOYEE solo ven su propio negocio
    if (!businessId) {
      throw new ForbiddenException('No tienes un negocio asignado');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            users: true,
            clientBusinesses: true, 
            products: true,
            transactions: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return [business];
  }

  /**
   * Encontrar un negocio por ID
   * SUPER_ADMIN: puede ver cualquier negocio
   * OWNER/CO_OWNER/EMPLOYEE: solo puede ver su propio negocio
   */
  async findOne(id: string, role: UserRole, businessId?: string) {
    // SUPER_ADMIN puede ver cualquier negocio
    if (role !== UserRole.SUPER_ADMIN) {
      // Los demás solo pueden ver su propio negocio
      if (!businessId || id !== businessId) {
        throw new ForbiddenException('No tienes acceso a este negocio');
      }
    }

    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        users: {
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
        },
        _count: {
          select: {
            clientBusinesses: true, 
            transactions: true,
            products: true,
            rewards: true,
            pointRules: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return business;
  }

  /**
   * Actualizar un negocio
   * SUPER_ADMIN: puede actualizar cualquier negocio
   * OWNER/CO_OWNER: solo puede actualizar su propio negocio
   */
  async update(id: string, updateBusinessDto: UpdateBusinessDto, requestingUserId: string) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    // Solo SUPER_ADMIN, OWNER y CO_OWNER pueden actualizar
    if (
      requestingUser.role !== UserRole.SUPER_ADMIN && 
      requestingUser.role !== UserRole.OWNER && 
      requestingUser.role !== UserRole.CO_OWNER
    ) {
      throw new ForbiddenException('No tienes permisos para actualizar negocios');
    }

    // Verificar que el negocio exista
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Si no es SUPER_ADMIN, verificar que sea su propio negocio
    if (requestingUser.role !== UserRole.SUPER_ADMIN && requestingUser.businessId !== id) {
      throw new ForbiddenException('Solo puedes actualizar tu propio negocio');
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  /**
   * Obtener estadísticas del negocio
   * SUPER_ADMIN: puede ver estadísticas de cualquier negocio
   * OWNER/CO_OWNER/EMPLOYEE: solo puede ver estadísticas de su propio negocio
   */
  async getStats(id: string, role: UserRole, businessId?: string) {
    // SUPER_ADMIN puede ver cualquier negocio
    if (role !== UserRole.SUPER_ADMIN) {
      // Los demás solo pueden ver su propio negocio
      if (!businessId || id !== businessId) {
        throw new ForbiddenException('No tienes acceso a este negocio');
      }
    }

    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const [
      totalUsers,
      activeUsers,
      totalClients,
      activeClients,
      totalProducts,
      activeProducts,
      totalTransactions,
      completedTransactions,
      totalRewards,
      activeRewards,
    ] = await Promise.all([
      this.prisma.user.count({ where: { businessId: id } }),
      this.prisma.user.count({ where: { businessId: id, active: true } }),
      

      this.prisma.clientBusiness.count({ where: { businessId: id } }),
      this.prisma.clientBusiness.count({ where: { businessId: id, active: true } }),
      
      this.prisma.product.count({ where: { businessId: id } }),
      this.prisma.product.count({ where: { businessId: id, active: true } }),
      this.prisma.transaction.count({ where: { businessId: id } }),
      this.prisma.transaction.count({ 
        where: { businessId: id, status: 'COMPLETED' } 
      }),
      this.prisma.reward.count({ where: { businessId: id } }),
      this.prisma.reward.count({ where: { businessId: id, active: true } }),
    ]);

    return {
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        createdAt: business.createdAt,
      },
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        clients: {
          total: totalClients,
          active: activeClients,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
        },
        rewards: {
          total: totalRewards,
          active: activeRewards,
        },
      },
    };
  }
}