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
  ParseUUIDPipe
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, createUserDto.requestingUserId);
  }

  @Get('business/:businessId')
  findAll(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.usersService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Body('requestingUserId', ParseUUIDPipe) requestingUserId: string,
  ) {
    return this.usersService.update(id, updateUserDto, requestingUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('requestingUserId', ParseUUIDPipe) requestingUserId: string,
  ) {
    return this.usersService.deactivate(id, requestingUserId);
  }

  @Patch(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('requestingUserId', ParseUUIDPipe) requestingUserId: string,
  ) {
    return this.usersService.activate(id, requestingUserId);
  }
}