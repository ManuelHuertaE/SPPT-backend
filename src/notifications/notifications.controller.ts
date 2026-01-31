import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Public()
    @Post('verify/request')
    @ApiOperation({ 
        summary: 'Solicitar código de verificación',
        description: 'Envía un código de verificación de 6 dígitos por SMS al teléfono especificado'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Código enviado exitosamente',
        schema: {
            example: {
                message: 'Código de verificación enviado',
                expiresIn: '10 minutos'
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    @ApiResponse({ status: 400, description: 'El cliente ya está verificado' })
    async requestVerification(@Body() requestDto: RequestVerificationDto) {
        return this.notificationsService.requestVerification(requestDto);
    }

    @Public()
    @Post('verify/confirm')
    @ApiOperation({ 
        summary: 'Verificar código de verificación',
        description: 'Valida el código de verificación enviado por SMS'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Teléfono verificado exitosamente',
        schema: {
            example: {
                message: 'Teléfono verificado exitosamente',
                phoneVerified: true
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Código inválido o expirado' })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    async verifyCode(@Body() verifyDto: VerifyCodeDto) {
        return this.notificationsService.verifyCode(verifyDto);
    }
}