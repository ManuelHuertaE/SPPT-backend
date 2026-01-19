import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    // WIP: Obtener userId del JWT
    @Body('userId') userId: string,
  ) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    // TODO: Get requesting userId from JWT and verify is OWNER
    @Body('requestingUserId') requestingUserId: string,
  ) {
    // TODO: Verify requesting user is OWNER before allowing reset
    return this.authService.resetPassword(
      resetPasswordDto.userId,
      resetPasswordDto.newPassword,
    );
  }
}