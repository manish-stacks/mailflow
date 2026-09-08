import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api', {
    // Public endpoints hit by mail clients and providers stay outside /api.
    exclude: ['tracking/open/:token', 'tracking/click/:token', 'storage/(.*)'],
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  // Raw body retained for webhook signature verification.
  app.use('/api/webhooks', express.json({
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); },
  }));

  app.enableCors({
    origin: config.get('corsOrigins'),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.set('trust proxy', 1);

  const port = config.get('port');
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on http://localhost:${port}/api`);
}

bootstrap();
