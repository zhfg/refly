import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { Profile } from 'passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User as UserModel, VerificationSession } from '@prisma/client';
import { JwtPayload } from './dto';
import { genUID, genVerificationSessionID } from '@refly-packages/utils';
import { PrismaService } from '@/common/prisma.service';
import { MiscService } from '@/misc/misc.service';
import { Resend } from 'resend';
import {
  AuthConfigItem,
  CheckVerificationRequest,
  CreateVerificationRequest,
} from '@refly-packages/openapi-schema';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private resend: Resend;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private miscService: MiscService,
  ) {
    this.resend = new Resend(this.configService.get('auth.email.resendApiKey'));
  }

  getAuthConfig(): AuthConfigItem[] {
    const items: AuthConfigItem[] = [];
    if (this.configService.get('auth.email.enabled')) {
      items.push({ provider: 'email' });
    }
    if (this.configService.get('auth.google.enabled')) {
      items.push({ provider: 'google' });
    }
    if (this.configService.get('auth.github.enabled')) {
      items.push({ provider: 'github' });
    }
    return items;
  }

  async login(user: UserModel) {
    const payload: JwtPayload = { uid: user.uid, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwt.secret'),
      }),
    };
  }

  redirect(res: Response, accessToken: string) {
    res
      .cookie(this.configService.get('auth.cookieTokenField'), accessToken, {
        domain: this.configService.get('auth.cookieDomain'),
      })
      .redirect(this.configService.get('auth.redirectUrl'));
  }

  /**
   * General OAuth logic
   * @param accessToken
   * @param refreshToken
   * @param profile
   */
  async oauthValidate(accessToken: string, refreshToken: string, profile: Profile) {
    this.logger.log(
      `oauth accessToken: ${accessToken}, refreshToken: ${refreshToken}, profile: ${JSON.stringify(
        profile,
      )}`,
    );
    const { provider, id, emails, displayName, photos } = profile;

    // Check if there is an authentication account record
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: id,
        },
      },
    });

    // If there is an authentication account record and corresponding user, return directly
    if (account) {
      this.logger.log(`account found for provider ${provider}, account id: ${id}`);
      const user = await this.prisma.user.findUnique({
        where: {
          uid: account.uid,
        },
      });
      if (user) {
        return user;
      }

      this.logger.log(`user ${account.uid} not found for provider ${provider} account id: ${id}`);
    }

    // oauth profile returns no email, this is invalid
    // TODO: Optimize error code
    if (emails?.length === 0) {
      throw new UnauthorizedException('emails is empty, invalid oauth');
    }
    const email = emails[0].value;

    // Return user if this email has been registered
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      this.logger.log(`user ${user.uid} already registered for email ${email}`);
      return user;
    }

    const namePrefix = email.split('@')[0];
    let name = namePrefix;

    // Check if the name already exists and add a random suffix if it does
    let userExists = await this.prisma.user.findUnique({ where: { name } });
    while (userExists) {
      const randomSuffix = randomBytes(3).toString('hex');
      name = `${namePrefix}_${randomSuffix}`;
      userExists = await this.prisma.user.findUnique({ where: { name } });
    }

    const uid = genUID();

    // download avatar if profile photo exists
    let avatar: string;
    try {
      if (photos?.length > 0) {
        avatar = (await this.miscService.dumpFileFromURL({ uid }, photos[0].value)).url;
      }
    } catch (e) {
      this.logger.warn(`failed to download avatar: ${e}`);
    }

    const newUser = await this.prisma.user.create({
      data: {
        name,
        nickname: displayName || name,
        uid,
        email,
        avatar,
        emailVerified: new Date(),
        outputLocale: 'auto',
      },
    });
    this.logger.log(`user created: ${newUser.uid}`);

    const newAccount = await this.prisma.account.create({
      data: {
        type: 'oauth',
        uid: newUser.uid,
        provider,
        providerAccountId: id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
    this.logger.log(`new account created for ${newAccount.uid}`);

    return newUser;
  }

  async emailSignup(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    return this.createVerification({ email, purpose: 'signup', password });
  }

  async emailLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return this.login(user);
  }

  async createVerification({ email, purpose, password }: CreateVerificationRequest) {
    const sessionId = genVerificationSessionID();

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    let hashedPassword: string;
    if (password) {
      hashedPassword = await argon2.hash(password);
    }

    const session = await this.prisma.verificationSession.create({
      data: {
        email,
        code,
        purpose,
        sessionId,
        hashedPassword,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // await this.sendVerificationEmail(sessionId, session);

    return session;
  }

  async sendVerificationEmail(sessionId: string, session?: VerificationSession) {
    if (!session) {
      session = await this.prisma.verificationSession.findUnique({ where: { sessionId } });
    }
    await this.resend.emails.send({
      from: this.configService.get('auth.email.sender'),
      to: session.email,
      subject: 'Email Verification Code',
      html: `Your verification code is: ${session.code}`,
    });
  }

  async checkVerification({ sessionId, code }: CheckVerificationRequest) {
    const verification = await this.prisma.verificationSession.findUnique({
      where: { sessionId, expiresAt: { gt: new Date() } },
    });

    if (!verification) {
      throw new UnauthorizedException('Invalid or expired verification session');
    }

    if (verification.code !== code) {
      throw new UnauthorizedException('Verification code is incorrect');
    }

    let user: UserModel;
    if (verification.purpose === 'signup') {
      user = await this.prisma.user.create({
        data: {
          email: verification.email,
          password: verification.hashedPassword,
          uid: genUID(),
          name: verification.email.split('@')[0],
          emailVerified: new Date(),
          outputLocale: 'auto',
        },
      });
    } else {
      user = await this.prisma.user.findUnique({ where: { email: verification.email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
    }

    const { accessToken } = await this.login(user);

    return { user, verification, accessToken };
  }
}
