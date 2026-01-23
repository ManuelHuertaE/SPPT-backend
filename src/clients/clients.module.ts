import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ClientsController],
  providers: [ClientsService, JwtClientStrategy],
  exports: [ClientsService],
})
export class ClientsModule {}