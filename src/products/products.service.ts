import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserRole, User } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Método privado para validar usuarios y permisos
     */
    private async validateUserAndBusiness(userId: string, requiredRoles?: UserRole[]): Promise<User & { businessId: string}> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId},
            include: { business: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!user.businessId) {
            throw new ForbiddenException('No tienes un negocio asignado');
        }

        if (requiredRoles && !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('No tienes permisos suficientes');
        }

        return user as User & { businessId: string };
    }

    /**
     * Método privado para validar que un producto existe y pertenece  al negocio del usuario
     */
    private async validateProductAccess(productId: string, businessId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Producto no encontrado');
        }

        if (product.businessId !== businessId) {
            throw new ForbiddenException('No tienes acceso a este producto');
        }

        return product;
    }

    /**
     * Crear un nuevo producto
     * Solo OWNER, CO_OWNER y EMPLOYEE pueden crear productos
     */
    async create(createProductDto: CreateProductDto, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE]);

        const product = await this.prisma.product.create({
            data: {
                name: createProductDto.name,
                description: createProductDto.description,
                sku: createProductDto.sku,
                price: createProductDto.price,
                pointsValue: createProductDto.pointsValue,
                active: createProductDto.active ?? true,
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

        return product;
    }

    /**
     * Obtener todos los productos del negocio
     * Opción de filtrar solo productos activos
     */
    async findAllByBusiness(userId: string, activeOnly: boolean = false) {
        const user = await this.validateUserAndBusiness(userId);

        const products = await this.prisma.product.findMany({
            where: {
                businessId: user.businessId,
                ...(activeOnly && { active: true }),
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

        return products;
    }

    /**
     * Obtener un producto específico por su ID
     */
    async findOne(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId);
        const product = await this.validateProductAccess(id, user.businessId);

        return this.prisma.product.findUnique({
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
    }

    /**
     *  Buscar productos por SKU
     */
    async findBySku(sku: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId);

        const product = await this.prisma.product.findFirst({
            where: {
                sku,
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

        if (!product) {
            throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
        }

        return product;
    }

    /**
     * Actualizar un producto 
     * Solo OWNER, CO_OWNER y EMPLOYEE pueden actualizar productos
     */
    async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE]);
        await this.validateProductAccess(id, user.businessId);

        const product = await this.prisma.product.update({
            where: { id },
            data: {
                ...(updateProductDto.name !== undefined && { name: updateProductDto.name }),
                ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
                ...(updateProductDto.sku !== undefined && { sku: updateProductDto.sku }),
                ...(updateProductDto.price !== undefined && { price: updateProductDto.price }),
                ...(updateProductDto.pointsValue !== undefined && { pointsValue: updateProductDto.pointsValue }),
                ...(updateProductDto.active !== undefined && { active: updateProductDto.active }),
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

        return product;
    }

    /**
     * Eliminar un producto (soft delete)
     * Solo OWNER y CO_OWNER pueden eliminar productos
     */
    async remove(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);
        await this.validateProductAccess(id, user.businessId);

        // Soft delete: marcar el producto como inactivo
        const product = await this.prisma.product.update({
            where: { id },
            data: { active: false },
        });

        return {
            message: `Producto ${product.name} desactivado correctamente`,
            product,
        };
    }

    async restore(id: string, userId: string) {
        const user = await this.validateUserAndBusiness(userId, [UserRole.OWNER, UserRole.CO_OWNER]);
        await this.validateProductAccess(id, user.businessId);

        // Restaurar el producto: marcar el producto como activo
        const product = await this.prisma.product.update({
            where: { id },
            data: { active: true },
        });

        return {
            message: `Producto ${product.name} marcado como activo correctamente`,
            product,
        }
    }
    
}