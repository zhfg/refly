import { Injectable, Logger } from '@nestjs/common';
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
import {
  AccountNotFoundError,
  EmailAlreadyRegistered,
  IncorrectVerificationCode,
  InvalidVerificationSession,
  OAuthError,
  ParamsError,
  PasswordIncorrect,
} from '@refly-packages/errors';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_SEND_VERIFICATION_EMAIL } from '@/utils/const';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private resend: Resend;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private miscService: MiscService,
    @InjectQueue(QUEUE_SEND_VERIFICATION_EMAIL) private emailQueue: Queue,
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

  async genUniqueUsername(candidate: string) {
    let name = candidate;
    let userExists = await this.prisma.user.findUnique({ where: { name } });
    while (userExists) {
      const randomSuffix = randomBytes(3).toString('hex');
      name = `${candidate}_${randomSuffix}`;
      userExists = await this.prisma.user.findUnique({ where: { name } });
    }
    return name;
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
      this.logger.warn(`emails is empty, invalid oauth`);
      throw new OAuthError();
    }
    const email = emails[0].value;

    // Return user if this email has been registered
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      this.logger.log(`user ${user.uid} already registered for email ${email}`);
      return user;
    }

    const uid = genUID();
    const name = await this.genUniqueUsername(email.split('@')[0]);

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
      throw new EmailAlreadyRegistered();
    }

    return this.createVerification({ email, purpose: 'signup', password });
  }

  async emailLogin(email: string, password: string) {
    if (!email?.trim() || !password?.trim()) {
      throw new ParamsError('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AccountNotFoundError();
    }

    try {
      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new PasswordIncorrect();
      }
    } catch (error) {
      this.logger.error(`Password verification failed: ${error.message}`);
      throw new PasswordIncorrect();
    }

    return this.login(user);
  }

  async createVerification({ email, purpose, password }: CreateVerificationRequest) {
    const sessionId = genVerificationSessionID();

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (purpose === 'resetPassword' && !password) {
      throw new ParamsError('Password is required to reset password');
    }

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

    await this.addSendVerificationEmailJob(sessionId);

    return session;
  }

  async addSendVerificationEmailJob(sessionId: string) {
    await this.emailQueue.add('verifyEmail', { sessionId });
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
      throw new InvalidVerificationSession();
    }

    if (verification.code !== code) {
      throw new IncorrectVerificationCode();
    }

    const { purpose, email, hashedPassword } = verification;

    let user: UserModel;
    if (purpose === 'signup') {
      const name = await this.genUniqueUsername(email.split('@')[0]);
      user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          uid: genUID(),
          name,
          nickname: name,
          emailVerified: new Date(),
          outputLocale: 'auto',
        },
      });
    } else if (purpose === 'resetPassword') {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AccountNotFoundError();
      }
      await this.prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
    } else {
      throw new ParamsError(`Invalid verification purpose: ${purpose}`);
    }

    const { accessToken } = await this.login(user);

    return { user, verification, accessToken };
  }
}
