import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestVerificationDto {
    @ApiProperty({
        description: 'Número de teléfono a verificar (formato internacional)',
        example: '+573121959638',
    })
    @IsString()
    @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'El formato del teléfono es inválido',
    })
    phone: string;
}