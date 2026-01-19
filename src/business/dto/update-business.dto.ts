import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateBusinessDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del negocio debe tener al menos 3 caracteres' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  status?: string;
}