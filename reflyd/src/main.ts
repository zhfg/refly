import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import tracer from './tracer';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { setTraceID } from './middleware/set-trace-id';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', err);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('unhandledRejection', err);
  });

  app.useLogger(logger);
  app.use(setTraceID);
  app.use(helmet());
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  // app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('/v1', { exclude: ['/'] });

  const config = new DocumentBuilder()
    .setTitle('Refly Backend API')
    .setDescription('The Refly API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  tracer.start();
  const configService = app.get(ConfigService);
  await app.listen(configService.get('port'));
}
bootstrap();
