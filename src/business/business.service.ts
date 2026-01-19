import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear un nuevo negocio
   * Solo los usuarios OWNER pueden crear negocios
   */
  async create(createBusinessDto: CreateBusinessDto, requestingUserId: string) {
    // Verificar que el usuario solicitante exista y sea un OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden crear negocios');
    }

    // Crear negocio
    const business = await this.prisma.business.create({
      data: {
        name: createBusinessDto.name,
        status: createBusinessDto.status || 'ACTIVE',
      },
    });

    return business;
  }

  /**
   * Encontrar todos los negocios
   */
  async findAll() {
    return this.prisma.business.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            products: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Encontrar un negocio por ID
   */
  async findOne(id: string) {
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
            clients: true,
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
   */
  async update(id: string, updateBusinessDto: UpdateBusinessDto, requestingUserId: string) {
    // Verificar que el usuario solicitante sea un OWNER
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    if (requestingUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo los usuarios OWNER pueden actualizar negocios');
    }

    // Verificar que el negocio exista
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Opcional: Verificar que el usuario solicitante pertenezca al negocio que intenta actualizar
    if (requestingUser.businessId !== id) {
      throw new ForbiddenException('Solo puedes actualizar tu propio negocio');
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  /**
   * Obtener estadísticas del negocio
   */
  async getStats(id: string) {
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
      this.prisma.client.count({ where: { businessId: id } }),
      this.prisma.client.count({ where: { businessId: id, active: true } }),
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