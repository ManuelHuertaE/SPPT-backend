import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'El teléfono debe tener entre 10 y 15 dígitos',
  })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string; // 👈 Ahora obligatorio (no opcional)
}