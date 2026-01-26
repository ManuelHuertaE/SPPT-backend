import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{10,14}$/, {
    message: 'El teléfono debe ser un número válido (ej: +573121959638 o 3121959638)',
  })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string; // 👈 Ahora obligatorio (no opcional)
}