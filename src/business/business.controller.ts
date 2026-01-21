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
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // SUPER_ADMIN y OWNER pueden crear negocios
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(ValidationPipe) createBusinessDto: CreateBusinessDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.businessService.create(createBusinessDto, requestingUserId);
  }

  // Todos los roles pueden listar (filtrado por rol en el service)
  @Get()
  findAll(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.findAll(role, businessId);
  }

  // Todos los roles pueden ver un negocio (validación por rol en el service)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.findOne(id, role, businessId);
  }

  // Todos los roles pueden ver estadísticas (validación por rol en el service)
  @Get(':id/stats')
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('businessId') businessId?: string,
  ) {
    return this.businessService.getStats(id, role, businessId);
  }

  // SUPER_ADMIN y OWNER pueden actualizar negocios
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateBusinessDto: UpdateBusinessDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.businessService.update(id, updateBusinessDto, requestingUserId);
  }
}