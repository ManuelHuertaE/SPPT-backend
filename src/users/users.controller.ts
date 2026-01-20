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
  ForbiddenException,
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

  // Solo OWNER puede crear usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Post()
  create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser('businessId') businessId: string,
  ) {
    return this.usersService.create(createUserDto, businessId);
  }

  // Ambos roles pueden listar usuarios de su negocio
  @Get()
  findAll(@CurrentUser('businessId') businessId: string) {
    return this.usersService.findAll(businessId);
  }

  // Ambos roles pueden ver un usuario específico (se valida que sea del mismo negocio en el service)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('businessId') businessId: string,
  ) {
    return this.usersService.findOne(id, businessId);
  }

  // Solo OWNER puede actualizar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('businessId') businessId: string,
  ) {
    return this.usersService.update(id, updateUserDto, requestingUserId, businessId);
  }

  // Solo OWNER puede desactivar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('businessId') businessId: string,
  ) {
    return this.usersService.deactivate(id, requestingUserId, businessId);
  }

  // Solo OWNER puede activar usuarios
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Patch(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('businessId') businessId: string,
  ) {
    return this.usersService.activate(id, requestingUserId, businessId);
  }
}