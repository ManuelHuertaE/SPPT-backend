import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PointRulesService } from './point-rules.service';
import { CreatePointRuleDto } from './dto/create-point-rule.dto';
import { UpdatePointRuleDto } from './dto/update-point-rule.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Point Rules')
@ApiBearerAuth('JWT-auth')
@Controller('point-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PointRulesController {
    constructor(private readonly pointRulesService: PointRulesService) {}

    @Post()
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Crear nueva regla de puntos',
        description: 'Solo usuarios OWNER y CO_OWNER pueden crear reglas de puntos para su negocio'
    })
    @ApiResponse({ status: 201, description: 'Regla de puntos creada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para crear reglas de puntos' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    create(
        @Body() createPointRuleDto: CreatePointRuleDto,
        @CurrentUser() user: any,
    ) {
        return this.pointRulesService.create(createPointRuleDto, user.id);
    }

    @Get()
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Obtener todas las reglas de puntos',
        description: 'Retorna todas las reglas de puntos del negocio del usuario autenticado'
    })
    @ApiResponse({ status: 200, description: 'Lista de reglas de puntos' })
    @ApiResponse({ status: 403, description: 'No tienes un negocio asignado' })
    findAll(@CurrentUser() user: any) {
        return this.pointRulesService.findAllByBusiness(user.id);
    }

    @Get('active')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Obtener la regla de puntos activa actual',
        description: 'Retorna la regla de puntos más reciente que esté activa y dentro de su período de validez'
    })
    @ApiResponse({ status: 200, description: 'Regla de puntos activa' })
    @ApiResponse({ status: 404, description: 'No se encontró una regla activa' })
    async findActiveRule(@CurrentUser() user: any) {
        const userDetails = await this.pointRulesService['prisma'].user.findUnique({
            where: { id: user.id },
        });

        if (!userDetails?.businessId) {
            throw new Error('No tienes un negocio asignado');
        }

        return this.pointRulesService.findActiveRule(userDetails.businessId);
    }

    @Get(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER, UserRole.EMPLOYEE)
    @ApiOperation({
        summary: 'Obtener una regla de puntos específica',
        description: 'Retorna los detalles de una regla de puntos por su ID'
    })
    @ApiParam({ name: 'id', description: 'ID de la regla de puntos (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Regla de puntos encontrada' })
    @ApiResponse({ status: 404, description: 'Regla de puntos no encontrada' })
    @ApiResponse({ status: 403, description: 'No tienes acceso a esta regla de puntos' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.pointRulesService.findOne(id, user.id);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Actualizar una regla de puntos',
        description: 'Solo usuarios OWNER y CO_OWNER pueden actualizar reglas de puntos'
    })
    @ApiParam({ name: 'id', description: 'ID de la regla de puntos (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Regla de puntos actualizada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar reglas de puntos' })
    @ApiResponse({ status: 404, description: 'Regla de puntos no encontrada' })
    update(
        @Param('id') id: string,
        @Body() updatePointRuleDto: UpdatePointRuleDto,
        @CurrentUser() user: any,
    ) {
        return this.pointRulesService.update(id, updatePointRuleDto, user.id);
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Desactivar una regla de puntos',
        description: 'Desactiva una regla de puntos sin eliminarla (soft delete)'
    })
    @ApiParam({ name: 'id', description: 'ID de la regla de puntos (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Regla de puntos desactivada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para desactivar reglas de puntos' })
    @ApiResponse({ status: 404, description: 'Regla de puntos no encontrada' })
    deactivate(@Param('id') id: string, @CurrentUser() user: any) {
        return this.pointRulesService.deactivate(id, user.id);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.CO_OWNER)
    @ApiOperation({
        summary: 'Eliminar una regla de puntos',
        description: 'Elimina permanentemente una regla de puntos (hard delete)'
    })
    @ApiParam({ name: 'id', description: 'ID de la regla de puntos (UUID)', type: 'string' })
    @ApiResponse({ status: 200, description: 'Regla de puntos eliminada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar reglas de puntos' })
    @ApiResponse({ status: 404, description: 'Regla de puntos no encontrada' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.pointRulesService.remove(id, user.id);
    }
}