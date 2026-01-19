import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString({ message: 'El/los apellido(s) debe(n) ser una cadena de texto' })
  @IsNotEmpty({ message: 'El/los apellido(s) es obligatorio' })
  lastName: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser OWNER o EMPLOYEE' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: UserRole;

  @IsUUID('4', { message: 'El ID de la tienda debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la tienda es obligatorio' })
  businessId: string;

  @IsUUID('4', { message: 'El ID del usuario solicitante debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del usuario solicitante es obligatorio' })
  requestingUserId: string;
}
