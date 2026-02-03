// src/products/products.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Crear nuevo producto',
        description: 'Usuarios OWNER, CO_OWNER y EMPLOYEE pueden crear productos para su negocio'
    })
    @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para crear productos' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    create(
        @Body() createProductDto: CreateProductDto,
        @CurrentUser() user: any,
    ) {
        return this.productsService.create(createProductDto, user.id);
    }

    @Get()
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Obtener todos los productos',
        description: 'Retorna todos los productos del negocio del usuario autenticado'
    })
    @ApiQuery({
        name: 'activeOnly',
        required: false,
        type: Boolean,
        description: 'Filtrar solo productos activos',
        example: true
    })
    @ApiResponse({ status: 200, description: 'Lista de productos' })
    @ApiResponse({ status: 403, description: 'No tienes un negocio asignado' })
    findAll(
        @CurrentUser() user: any,
        @Query('activeOnly') activeOnly?: string,
    ) {
        const active = activeOnly === 'true';
        return this.productsService.findAllByBusiness(user.id, active);
    }

    @Get('sku/:sku')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Buscar producto por SKU',
        description: 'Retorna un producto específico usando su código SKU'
    })
    @ApiParam({ name: 'sku', description: 'Código SKU del producto', type: 'string', example: 'CAFE-001' })
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    findBySku(@Param('sku') sku: string, @CurrentUser() user: any) {
        return this.productsService.findBySku(sku, user.id);
    }

    @Get(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Obtener un producto específico',
        description: 'Retorna los detalles de un producto por su ID'
    })
    @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    @ApiResponse({ status: 403, description: 'No tienes acceso a este producto' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.findOne(id, user.id);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Actualizar un producto',
        description: 'Usuarios OWNER, CO_OWNER y EMPLOYEE pueden actualizar productos'
    })
    @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar productos' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @CurrentUser() user: any,
    ) {
        return this.productsService.update(id, updateProductDto, user.id);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Desactivar un producto',
        description: 'Solo OWNER y CO_OWNER pueden desactivar productos (soft delete)'
    })
    @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Producto desactivado exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar productos' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.remove(id, user.id);
    }

    @Patch(':id/restore')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Restaurar un producto desactivado',
        description: 'Solo OWNER y CO_OWNER pueden restaurar productos'
    })
    @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Producto restaurado exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para restaurar productos' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    restore(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.restore(id, user.id);
    }
}