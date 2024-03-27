import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.use(cookieParser());

  app.setGlobalPrefix('/v1', { exclude: ['/'] });

  const config = new DocumentBuilder()
    .setTitle('Refly Backend API')
    .setDescription('The Refly API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const proxyUrl = 'http://127.0.0.1:17890';
  const agent = new HttpsProxyAgent(proxyUrl);
  // @ts-ignore
  global.fetch = new Proxy(fetch, {
    apply: function (target, thisArg, args) {
      const result = target.apply(thisArg, {
        ...args,
        agent: agent,
      });

      return result;
    },
  });

  const configService = app.get(ConfigService);
  await app.listen(configService.get('port'));
}
bootstrap();
