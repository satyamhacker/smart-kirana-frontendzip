import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ─── Global Prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({ origin: true, credentials: true });

  // ─── Global Validation Pipe ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true,         // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Exception Filter ────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global Logging Interceptor ─────────────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ─── Swagger / OpenAPI ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Smart Kirana Store API')
      .setDescription('NestJS REST API for the Smart Kirana POS system')
      .setVersion('1.0')
      .addTag('products', 'Inventory & stock management')
      .addTag('customers', 'Customer & Khata management')
      .addTag('bills', 'Billing & invoicing')
      .addTag('dashboard', 'Dashboard summary')
      .addTag('reports', 'Sales, profit, and stock reports')
      .addTag('settings', 'Shop configuration')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    const logger = new Logger('Bootstrap');
    logger.log('Swagger UI available at /api/docs');
  }

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Kirana NestJS API running on port ${port}`);
}

bootstrap();
