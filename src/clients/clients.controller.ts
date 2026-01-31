import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import { ClientRefreshTokenDto } from './dto/client-refresh-token.dto';
import { JwtClientAuthGuard } from './guards/jtwt-client-auth.guard'; 
import { CurrentClient } from '../auth/decorators/current-client.decorator';
import { Public } from '../auth/decorators/public.decorator'; 

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar nuevo cliente',
    description: 'Crea una cuenta de cliente nueva'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Cliente registrado exitosamente',
    schema: {
      example: {
        message: 'Cliente registrado exitosamente',
        client: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Juan Pérez',
          phone: '+573121959638',
          email: 'juan@example.com'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'El teléfono o email ya está registrado' })
  async register(@Body() registerDto: RegisterClientDto) {
    return this.clientsService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión como cliente',
    description: 'Autentica un cliente usando teléfono/email y contraseña'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        client: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Juan Pérez',
          phone: '+573121959638'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Teléfono no verificado' })
  async login(@Body() loginDto: LoginClientDto) {
    return this.clientsService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refrescar token de acceso del cliente',
    description: 'Genera un nuevo access token usando un refresh token válido'
  })
  @ApiResponse({ status: 200, description: 'Token refrescado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() refreshTokenDto: ClientRefreshTokenDto) {
    return this.clientsService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Cerrar sesión del cliente',
    description: 'Revoca el refresh token del cliente'
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@Body() refreshTokenDto: ClientRefreshTokenDto) {
    return this.clientsService.logout(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener perfil del cliente',
    description: 'Retorna la información del cliente autenticado'
  })
  @ApiResponse({ status: 200, description: 'Perfil del cliente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@CurrentClient() client: any) {
    return this.clientsService.getProfile(client.id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('register-business')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Registrar cliente en un negocio',
    description: 'Asocia el cliente autenticado a un negocio específico'
  })
  @ApiResponse({ status: 201, description: 'Cliente registrado en el negocio exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya estás registrado en este negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener negocios del cliente',
    description: 'Retorna todos los negocios en los que el cliente está registrado'
  })
  @ApiResponse({ status: 200, description: 'Lista de negocios del cliente' })
  async getBusinesses(@CurrentClient() client: any) {
    return this.clientsService.getBusinesses(client.id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('businesses/:businessId/points')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener puntos del cliente en un negocio',
    description: 'Retorna los puntos acumulados del cliente en un negocio específico'
  })
  @ApiParam({ name: 'businessId', description: 'ID del negocio (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Puntos del cliente en el negocio' })
  @ApiResponse({ status: 404, description: 'No estás registrado en este negocio' })
  async getBusinessPoints(
    @CurrentClient() client: any,
    @Param('businessId') businessId: string,
  ) {
    return this.clientsService.getBusinessPoints(client.id, businessId);
  }
}