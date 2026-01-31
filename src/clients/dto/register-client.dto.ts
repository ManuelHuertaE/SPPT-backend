import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterClientDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente (formato internacional)',
    example: '+573121959638',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{10,14}$/, {
    message: 'El teléfono debe ser un número válido (ej: +573121959638 o 3121959638)',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del cliente (opcional)',
    example: 'juan@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Contraseña del cliente',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}