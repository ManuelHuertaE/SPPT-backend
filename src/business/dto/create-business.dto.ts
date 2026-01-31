import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Mi Tienda',
    minLength: 3,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del negocio debe tener al menos 3 caracteres' })
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  name: string;

  @ApiPropertyOptional({
    description: 'Estado del negocio',
    example: 'ACTIVE',
    default: 'ACTIVE',
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  status?: string;
}