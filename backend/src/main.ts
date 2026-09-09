import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true lets Nest capture the raw request buffer (req.rawBody) for every
  // request WITHOUT us manually calling express.json() ourselves. Manually scoping our
  // own express.json() (even to just /api/webhooks) makes Nest think body-parsing is
  // already handled by the app and it silently skips registering its own global JSON
  // parser — which broke req.body on every other route (e.g. /api/auth/register).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api', {
    // Public endpoints hit by mail clients and providers stay outside /api.
    exclude: ['tracking/open/:token', 'tracking/click/:token', 'storage/(.*)'],
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

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