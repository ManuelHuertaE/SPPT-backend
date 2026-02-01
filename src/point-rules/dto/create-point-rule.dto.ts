import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min} from 'class-validator';

export class CreatePointRuleDto {
    @ApiPropertyOptional({
        description: 'Nombre descriptivo de la regla de puntos',
        example: 'Regla estándar'
    })
    @IsOptional()
    @IsString()
    name?: string;
    
    @ApiProperty({
        description: 'Puntos que se otorgan por cada unidad monetaria.',
        example: 1,
        minimum: 0.01,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    pointsPerCurrencyUnit: number; // e.g.: 1 = "1 peso = 1 punto", 5 = "1 peso = 5 puntos"

    @ApiProperty({
        description: 'Monto mínimo de compra para que la regla sea aplicable.',
        example: 5,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    minAmount: number; // Monto mínimo para aplicar la regla

    @ApiPropertyOptional({
        description: 'Fecha desde cuando es válida la regla (Formato ISO 8601/timestamp)',
        example: '2026-01-31T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    validFrom?: string; // Fecha desde la cual la regla es válida

    @ApiPropertyOptional({
        description: 'Fecha hasta cuando es válida la regla (Formato ISO 8601/timestamp)',
        example: '2026-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    validUntil?: string; // Fecha hasta la cual la regla es válida (null = sin expiración)
}