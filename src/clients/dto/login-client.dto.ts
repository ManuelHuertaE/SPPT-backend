import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginClientDto {
  @IsString()
  @IsNotEmpty()
  phoneOrEmail: string; // Puede ser teléfono o email

  @IsString()
  @MinLength(6)
  password: string;
}