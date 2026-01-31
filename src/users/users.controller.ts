import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario actual',
    description: 'Retorna la información del usuario autenticado'
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@CurrentUser('id') userId: string){
    return this.usersService.getProfile(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Post()
  @ApiOperation({ 
    summary: 'Crear nuevo usuario',
    description: 'Solo SUPER_ADMIN, OWNER y CO_OWNER pueden crear usuarios'
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para crear usuarios' })
  @ApiResponse({ status: 400, description: 'Email ya existe' })
  create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.create(createUserDto, role, businessId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar usuarios',
    description: 'Retorna todos los usuarios según los permisos del usuario autenticado'
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.findAll(role, businessId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener un usuario específico',
    description: 'Retorna los detalles de un usuario por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este usuario' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.findOne(id, role, businessId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar un usuario',
    description: 'Solo SUPER_ADMIN, OWNER y CO_OWNER pueden actualizar usuarios'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar usuarios' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.update(id, updateUserDto, requestingUserId, role, businessId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar un usuario',
    description: 'Desactiva un usuario sin eliminarlo (soft delete)'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para desactivar usuarios' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.deactivate(id, requestingUserId, role, businessId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Patch(':id/activate')
  @ApiOperation({ 
    summary: 'Activar un usuario',
    description: 'Activa un usuario previamente desactivado'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario activado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para activar usuarios' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.activate(id, requestingUserId, role, businessId);
  }
}