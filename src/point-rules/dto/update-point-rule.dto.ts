import { PartialType } from "@nestjs/swagger";
import { CreatePointRuleDto } from "./create-point-rule.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePointRuleDto extends PartialType(CreatePointRuleDto) {
    @ApiPropertyOptional({
        description: 'Estado de la regla (activa/inactiva)',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}