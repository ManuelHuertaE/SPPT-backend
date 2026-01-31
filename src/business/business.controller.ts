import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Get('available')
  @ApiOperation({ 
    summary: 'Obtener negocios disponibles',
    description: 'Endpoint público que retorna todos los negocios activos disponibles'
  })
  @ApiResponse({ status: 200, description: 'Lista de negocios disponibles' })
  getAvailableBusinesses() {
    return this.businessService.getAvailableBusinesses();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Crear nuevo negocio',
    description: 'Solo SUPER_ADMIN y OWNER pueden crear negocios'
  })
  @ApiResponse({ status: 201, description: 'Negocio creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para crear negocios' })
  create(
    @Body(ValidationPipe) createBusinessDto: CreateBusinessDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.businessService.create(createBusinessDto, requestingUserId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar negocios',
    description: 'Retorna todos los negocios según los permisos del usuario'
  })
  @ApiResponse({ status: 200, description: 'Lista de negocios' })
  findAll(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.findAll(role, businessId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener un negocio específico',
    description: 'Retorna los detalles de un negocio por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID del negocio (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Negocio encontrado' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este negocio' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.findOne(id, role, businessId);
  }

  @Get(':id/stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener estadísticas del negocio',
    description: 'Retorna estadísticas detalladas de un negocio'
  })
  @ApiParam({ name: 'id', description: 'ID del negocio (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estadísticas del negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este negocio' })
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.getStats(id, role, businessId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Actualizar un negocio',
    description: 'Solo SUPER_ADMIN, OWNER y CO_OWNER pueden actualizar negocios'
  })
  @ApiParam({ name: 'id', description: 'ID del negocio (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Negocio actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar negocios' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateBusinessDto: UpdateBusinessDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.businessService.update(id, updateBusinessDto, requestingUserId);
  }
}