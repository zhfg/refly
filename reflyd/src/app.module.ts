import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import api from '@opentelemetry/api';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LlmModule } from './llm/llm.module';
import { AccountModule } from './account/account.module';
import { WeblinkModule } from './weblink/weblink.module';
import { RAGModule } from './rag/rag.module';
import { AigcModule } from './aigc/aigc.module';
import { ConversationModule } from './conversation/conversation.module';

import configuration from './config/app.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      cache: true,
      expandVariables: true,
    }),
    LoggerModule.forRootAsync({
      useFactory: async () => {
        return {
          pinoHttp: {
            autoLogging: true,
            base: null,
            quietReqLogger: true,
            genReqId: () => api.trace.getSpan(api.context.active())?.spanContext()?.traceId,
            level: 'debug',
            transport:
              process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
          },
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ConversationModule,
    UserModule,
    AccountModule,
    WeblinkModule,
    LlmModule,
    AigcModule,
    RAGModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
