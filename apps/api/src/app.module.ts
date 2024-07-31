import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import api from '@opentelemetry/api';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { RAGModule } from './rag/rag.module';
import { ConversationModule } from './conversation/conversation.module';

import configuration from './config/app.config';
import { AppController } from './app.controller';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SkillModule } from './skill/skill.module';
import { SearchModule } from './search/search.module';
import { LabelModule } from './label/label.module';

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
            autoLogging: false,
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
          password: configService.get('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ConversationModule,
    UserModule,
    AccountModule,
    RAGModule,
    KnowledgeModule,
    SkillModule,
    SearchModule,
    LabelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
