import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min} from 'class-validator';
import Api from 'twilio/lib/rest/Api';

export class CreateProductDto {
    @ApiProperty({
        description: 'Nombre del producto',
        example: 'Camiseta Deportiva'
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Descripción del producto',
        example: 'Camiseta deportiva de alta calidad, ideal para correr y hacer ejercicio.'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Código SKU del producto',
        example: 'CAM-DE-001'
    })
    @IsOptional()
    @IsString()
    sku?: string;
    
    @ApiProperty({
        description: 'Precio del producto',
        example: 100,
        minimum: 0
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({
        description: 'Valor en puntos del producto (en caso de que sea diferente al calculado por reglas)',
        example: 10,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsValue?: number;

    @ApiPropertyOptional({
        description: 'Indica si el producto está activo',
        example: true,
        default: true
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}