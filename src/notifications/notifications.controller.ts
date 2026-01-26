import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Public()
    @Post('verify/request')
    async requestVerification(@Body() requestDto: RequestVerificationDto) {
        return this.notificationsService.requestVerification(requestDto);
    }

    @Public()
    @Post('verify/confirm')
    async verifyCode(@Body() verifyDto: VerifyCodeDto) {
        return this.notificationsService.verifyCode(verifyDto);
    }
}