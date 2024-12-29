import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@/common/common.module';
import { MiscModule } from '@/misc/misc.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { GithubOauthStrategy } from './strategy/github-oauth.strategy';
import { GoogleOauthStrategy } from './strategy/google-oauth.strategy';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    MiscModule,
    PassportModule.register({
      session: true,
    }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        // available options: https://github.com/auth0/node-jsonwebtoken#usage
        secret: configService.get('auth.jwt.secret'),
        signOptions:
          process.env.NODE_ENV === 'development'
            ? undefined // never expire in development
            : { expiresIn: configService.get('auth.jwt.expiresIn') },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GithubOauthStrategy, GoogleOauthStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
