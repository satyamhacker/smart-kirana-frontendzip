import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api');

  app.enableCors({ origin: true, credentials: true });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Kirana NestJS API running on port ${port}`);
}

bootstrap();
