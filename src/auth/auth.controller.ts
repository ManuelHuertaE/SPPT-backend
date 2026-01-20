import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.userId,
      resetPasswordDto.newPassword,
    );
  }
}