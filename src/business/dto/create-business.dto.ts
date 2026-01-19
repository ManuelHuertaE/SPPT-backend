import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del negocio debe tener al menos 3 caracteres' })
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  name: string;

  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  status?: string;
}