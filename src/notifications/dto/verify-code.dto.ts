import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
    @ApiProperty({
        description: 'Número de teléfono del cliente',
        example: '+573121959638',
    })
    @IsString()
    @IsNotEmpty({ message: 'El teléfono es requerido' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'El formato del teléfono es inválido' })
    phone: string;

    @ApiProperty({
        description: 'Código de verificación de 6 dígitos',
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'El código es requerido' })
    @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
    code: string;
}