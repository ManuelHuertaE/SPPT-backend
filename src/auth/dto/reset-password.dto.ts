import {
    IsNotEmpty,
    IsString,
    MinLength,
    IsUUID
}
from 'class-validator';

export class ResetPasswordDto {
    @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
    @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
    userId: string;

    @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;
}