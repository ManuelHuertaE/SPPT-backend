import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import { ClientRefreshTokenDto } from './dto/client-refresh-token.dto';
import { JwtClientAuthGuard } from './guards/jtwt-client-auth.guard'; 
import { CurrentClient } from '../auth/decorators/current-client.decorator';
import { Public } from '../auth/decorators/public.decorator'; 

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterClientDto) {
    return this.clientsService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginClientDto) {
    return this.clientsService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: ClientRefreshTokenDto) {
    return this.clientsService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('logout')
  async logout(@Body() refreshTokenDto: ClientRefreshTokenDto) {
    return this.clientsService.logout(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('me')
  async getProfile(@CurrentClient() client: any) {
    return this.clientsService.getProfile(client.id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('register-business')
  async registerBusiness(
    @CurrentClient() client: any,
    @Body() registerBusinessDto: RegisterBusinessDto,
  ) {
    return this.clientsService.registerBusiness(
      client.id,
      registerBusinessDto,
    );
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('businesses')
  async getBusinesses(@CurrentClient() client: any) {
    return this.clientsService.getBusinesses(client.id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('businesses/:businessId/points')
  async getBusinessPoints(
    @CurrentClient() client: any,
    @Param('businessId') businessId: string,
  ) {
    return this.clientsService.getBusinessPoints(client.id, businessId);
  }
}