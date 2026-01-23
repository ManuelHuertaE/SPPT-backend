import { IsString, IsNotEmpty } from 'class-validator';

export class ClientRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}