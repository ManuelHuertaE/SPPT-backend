import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePointRuleDto } from './dto/create-point-rule.dto';
import { UpdatePointRuleDto } from './dto/update-point-rule.dto';
import { UserRole, User } from '@prisma/client';

@Injectable()
export class PointRulesService {
    constructor(private prisma: PrismaService) {}

    /**
     * Método privado para validar usuario y permisos
     */
    private async validateUserAndBusiness(userId: string, requiredRoles?: UserRole[]): Promise<User & { businessId: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { business: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!user.businessId) {
            throw new ForbiddenException('No tienes un negocio asignado');
        }

        if (requiredRoles && !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('No tienes permisos para realizar esta acción');
        }

        return user as User & { businessId: string };
    }

    /**
     * Método privado para validar que una regla de puntos existe y pertenece al negocio del usuario
     */
    private async validatePointRuleAccess(pointRuleId: string, businessId: string) {
        const pointRule = await this.prisma.pointRule.findUnique({
            where: { id: pointRuleId },
        });

        if (!pointRule) {
            throw new NotFoundException('Regla de puntos no encontrada');
        }

        if (pointRule.businessId !== businessId) {
            throw new ForbiddenException('No tienes acceso a esta regla de puntos');
        }

        return pointRule;
    }

    /** 
     * Crear una nueva regla de puntos
     * Solo OWNER y CO_OWNER pueden crear reglas de puntos (solo para su negocio)
    */
    async create(createPointRuleDto: CreatePointRuleDto, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);

        const pointRule = await this.prisma.pointRule.create({
            data: {
                name: createPointRuleDto.name,
                pointsPerCurrencyUnit: createPointRuleDto.pointsPerCurrencyUnit,
                minAmount: createPointRuleDto.minAmount,
                validFrom: createPointRuleDto.validFrom ? new Date(createPointRuleDto.validFrom) : new Date(),
                validUntil: createPointRuleDto.validUntil ? new Date(createPointRuleDto.validUntil) : null,
                businessId: user.businessId,
            },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return pointRule;
    }

    /**
     * Obtener todas las reglas de puntos de un negocio
     */
    async findAllByBusiness(userId: string) {
        const user = await this.validateUserAndBusiness(userId);

        const pointRules = await this.prisma.pointRule.findMany({
            where: {
                businessId: user.businessId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        
        return pointRules;
    }

    /**
     * Obtener una regla de puntos específica
     */
    async findOne(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId);

        const pointRule = await this.prisma.pointRule.findUnique({
            where: { id },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!pointRule) {
            throw new NotFoundException('Regla de puntos no encontrada');
        }

        if (pointRule.businessId !== user.businessId) {
            throw new ForbiddenException('No tienes acceso a esta regla de puntos');
        }

        return pointRule;
    }

    /**
     * Obtener la regla de puntos activa actual para un negocio
     * (la más reciente que esté activa y dentro de su período de validez)
     */
    async findActiveRule(businessId: string) {
        const now = new Date();

        const activeRule = await this.prisma.pointRule.findFirst({
            where: {
                businessId,
                active: true,
                validFrom: {
                    lte: now,
                },
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: now } },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return activeRule;
    }

    /**
     * Actualizar una regla de puntos
     * Solo OWNER y CO_OWNER pueden actualizar reglas de puntos (solo para su negocio)
     */
    async update(id: string, updatePointRuleDto: UpdatePointRuleDto, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);
        await this.validatePointRuleAccess(id, user.businessId);

        const updatedPointRule = await this.prisma.pointRule.update({
            where: { id },
            data: {
                name: updatePointRuleDto.name,
                pointsPerCurrencyUnit: updatePointRuleDto.pointsPerCurrencyUnit,
                minAmount: updatePointRuleDto.minAmount,
                validFrom: updatePointRuleDto.validFrom ? new Date(updatePointRuleDto.validFrom) : undefined,
                validUntil: updatePointRuleDto.validUntil ? new Date(updatePointRuleDto.validUntil) : undefined,
                active: updatePointRuleDto.active,
            },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return updatedPointRule;
    }

    /**
     * Desactivar una regla de puntos (soft delete)
     */
    async deactivate(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);
        await this.validatePointRuleAccess(id, user.businessId);

        const updatedPointRule = await this.prisma.pointRule.update({
            where: { id },
            data: { active: false },
        });

        return updatedPointRule;
    }

    /**
     * Eliminar una regla de puntos (hard delete)
     */
    async remove(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);
        await this.validatePointRuleAccess(id, user.businessId);

        await this.prisma.pointRule.delete({
            where: { id },
        });

        return { message: 'Regla de puntos eliminada correctamente' };
    }
}