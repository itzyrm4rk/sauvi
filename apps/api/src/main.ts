import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/filters/prisma-exception.filter';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Env, true>);
  const port = configService.get('PORT', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? [
            'https://sauvi.app',
            'https://sauvi-landing.vercel.app',
            configService.get('FRONTEND_URL', { infer: true }),
            /\.vercel\.app$/,
          ].filter(Boolean)
        : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SAUVI API')
    .setDescription("API de l'application mobile de don de sang d'urgence")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`SAUVI API démarrée sur le port ${port}`);
  logger.log(`Swagger disponible sur http://localhost:${port}/api/docs`);
}

bootstrap();
