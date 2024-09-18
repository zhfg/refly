import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
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
        nickname: displayName,
        uid,
        email,
        avatar,
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
}
