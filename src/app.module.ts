import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessModule } from './business/business.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ClientsModule } from './clients/clients.module';
import { NotificationsModule } from './notifications/notifications.module';

// 🔍 DEBUG: Verificar que el .env se cargue
console.log('🔍 DEBUG - Variables de entorno:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    BusinessModule,
    AuthModule,
    ClientsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  }],
})
export class AppModule {}
