import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @IsOptional()
  email?: string;

  @IsString({ message: ' El nombre debe ser una cadena de texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El/los apellido(s) debe(n) ser una cadena de texto' })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  active?: boolean;
}
