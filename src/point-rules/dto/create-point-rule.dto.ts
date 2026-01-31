import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreatePointRuleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    pointsPerCurrencyUnit: number; // e.g.: 1 = "1 peso = 1 punto", 5 = "1 peso = 5 puntos"

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    minAmount: number; // Monto mínimo para aplicar la regla

    @IsOptional()
    @IsDateString()
    validFrom?: string; // Fecha desde la cual la regla es válida

    @IsOptional()
    @IsDateString()
    validUntil?: string; // Fecha hasta la cual la regla es válida (null = sin expiración)
}