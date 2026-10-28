import * as dotenv from 'dotenv';
import * as path from 'path';

// Ensure .env is loaded in development, production build, and all environments
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global Prefix: /api
  app.setGlobalPrefix('api');

  // CORS configuration for Next.js frontend (local + Vercel deployment)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /https:\/\/.*\.vercel\.app$/,   // all Vercel preview & production domains
    /https:\/\/.*\.onrender\.com$/, // cross-service on Render
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('VietSky Airlines API')
    .setDescription(
      'Official Airline Ticket Booking System API — Direct-from-Airline REST services with RBAC, strong seat consistency, mock payments, loyalty program, and admin operations.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 VietSky Airlines API is running on: http://localhost:${port}/api`);
  logger.log(`📖 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
