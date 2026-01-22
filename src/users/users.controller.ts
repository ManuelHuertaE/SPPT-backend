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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // SUPER_ADMIN, OWNER y CO_OWNER pueden crear usuarios (con validaciones en el service)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Post()
  create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.create(createUserDto, role, businessId);
  }

  // Todos los roles pueden listar usuarios
  @Get()
  findAll(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.findAll(role, businessId);
  }

  // Todos los roles pueden ver un usuario específico
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.findOne(id, role, businessId);
  }

  // SUPER_ADMIN, OWNER y CO_OWNER pueden actualizar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.update(id, updateUserDto, requestingUserId, role, businessId);
  }

  // SUPER_ADMIN, OWNER y CO_OWNER pueden desactivar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.deactivate(id, requestingUserId, role, businessId);
  }

  // SUPER_ADMIN, OWNER y CO_OWNER pueden activar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.CO_OWNER)
  @Patch(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.usersService.activate(id, requestingUserId, role, businessId);
  }
}