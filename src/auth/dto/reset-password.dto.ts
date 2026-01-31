import {
    IsNotEmpty,
    IsString,
    MinLength,
    IsUUID
}
from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'ID del usuario al que se le reseteará la contraseña',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
    @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
    userId: string;

    @ApiProperty({
        description: 'Nueva contraseña para el usuario',
        example: 'newPassword123',
        minLength: 6,
    })
    @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;
}