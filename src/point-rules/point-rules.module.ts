// src/point-rules/point-rules.module.ts
import { Module } from '@nestjs/common';
import { PointRulesService } from './point-rules.service';
import { PointRulesController } from './point-rules.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PointRulesController],
  providers: [PointRulesService],
  exports: [PointRulesService], // Exportamos por si otros módulos lo necesitan
})
export class PointRulesModule {}