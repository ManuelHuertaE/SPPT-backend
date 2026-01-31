import {
    IsNotEmpty,
    IsString,
    MinLength,
}
from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Contraseña actual del usuario',
        example: 'oldPassword123',
    })
    @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
    currentPassword: string;

    @ApiProperty({
        description: 'Nueva contraseña del usuario',
        example: 'newPassword456',
        minLength: 6,
    })
    @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;
}