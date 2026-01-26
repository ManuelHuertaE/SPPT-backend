import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestVerificationDto {
    @IsString()
    @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
    @Matches(/^\+?[1-9]\d{1,14}$/, {})
    phone: string;
}