import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Profile } from 'passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { JwtPayload } from './dto';
import { genUID } from '@refly/utils';
import { PrismaService } from '@/common/prisma.service';
import { MiscService } from '@/misc/misc.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private miscService: MiscService,
  ) {}

  async validateEmailPass(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    this.logger.log('validate user:', user, pass);
    if (user) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = { uid: user.uid, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwt.secret'),
      }),
    };
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
          id: account.userId,
        },
      });
      if (user) {
        return user;
      }

      this.logger.log(
        `user ${account.userId} not found for provider ${provider} account id: ${id}`,
      );
    }

    // oauth profile returns no email, this is invalid
    // TODO: Optimize error code
    if (emails?.length === 0) {
      throw new UnauthorizedException('emails is empty, invalid oauth');
    }
    const email = emails[0].value;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      return user;
    }

    // Insert or update user (based on email)
    const { url: avatar } = await this.miscService.dumpFileFromURL(photos[0].value);
    const newUser = await this.prisma.user.create({
      data: {
        name: displayName,
        uid: genUID(),
        email,
        avatar,
      },
    });
    this.logger.log(`user created: ${newUser.uid}`);

    const newAccount = await this.prisma.account.create({
      data: {
        type: 'oauth',
        userId: newUser.id,
        provider,
        providerAccountId: id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
    this.logger.log(`new account created: ${newAccount.id}`);

    return newUser;
  }
}
