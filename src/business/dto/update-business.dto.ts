import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiPropertyOptional({
    description: 'Nombre del negocio',
    example: 'Mi Tienda Actualizada',
    minLength: 3,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del negocio debe tener al menos 3 caracteres' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Estado del negocio',
    example: 'ACTIVE',
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  status?: string;
}