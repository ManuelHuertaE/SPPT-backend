import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Enable CORS if needed
  app.enableCors();

  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SPPT API')
    .setDescription('Sistema de Puntos y Programas de Lealtad - API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for reference in controllers
    )
    .addTag('Auth', 'Autenticación de usuarios')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Business', 'Gestión de negocios')
    .addTag('Clients', 'Gestión de clientes')
    .addTag('Notifications', 'Notificaciones y verificación')
    .addTag('Point Rules', 'Reglas de puntos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token después de refrescar
    },
  });

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger documentation available at: http://localhost:3000/api/docs`);
}
bootstrap();
