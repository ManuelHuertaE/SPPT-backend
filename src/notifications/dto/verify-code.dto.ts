import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyCodeDto {
    @IsString()
    @IsNotEmpty({ message: 'El teléfono es requerido' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'El formato del teléfono es inválido' })
    phone: string;

    @IsString()
    @IsNotEmpty({ message: 'El código es requerido' })
    @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
    code: string;
}