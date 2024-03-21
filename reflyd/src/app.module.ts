import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LlmModule } from './llm/llm.module';
import { AccountModule } from './account/account.module';
import { WeblinkModule } from './weblink/weblink.module';
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
  ],
  controllers: [AppController],
})
export class AppModule {}
