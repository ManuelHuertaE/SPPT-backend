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
  ParseUUIDPipe
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(ValidationPipe) createBusinessDto: CreateBusinessDto,
    // WIP: Reemplazar con el ID de usuario autenticado real desde JWT/sesión
    @Body('requestingUserId', ParseUUIDPipe) requestingUserId: string,
  ) {
    return this.businessService.create(createBusinessDto, requestingUserId);
  }

  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessService.getStats(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateBusinessDto: UpdateBusinessDto,
    // WIP: Reemplazar con el ID de usuario autenticado real desde JWT/sesión
    @Body('requestingUserId', ParseUUIDPipe) requestingUserId: string,
  ) {
    return this.businessService.update(id, updateBusinessDto, requestingUserId);
  }
}