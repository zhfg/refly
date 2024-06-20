import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Profile } from 'passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { AccountService } from '../account/account.service';
import { UserService } from '../user/user.service';
import { JwtPayload } from './dto';
import { genUID } from '@refly/utils';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private accountService: AccountService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateEmailPass(email: string, pass: string) {
    const user = await this.userService.findUnique({ email });
    this.logger.log('validate user:', user);
    if (user) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = { id: String(user.id), email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwt.secret'),
      }),
    };
  }

  /**
   * 通用 OAuth 鉴权逻辑
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

    // 先查找是否存在认证记录
    const account = await this.accountService.findUnique({
      provider_providerAccountId: {
        provider,
        providerAccountId: id,
      },
    });

    // 如果有认证账户，且存在对应的用户，则直接返回
    if (account) {
      this.logger.log(`account found for provider ${provider}, account id: ${id}`);
      const user = await this.userService.findUnique({
        id: account.userId,
      });
      if (user) {
        return user;
      }

      this.logger.log(
        `user ${account.userId} not found for provider ${provider} account id: ${id}`,
      );
    }

    // oauth 账号无对应邮箱，认证报错
    // TODO: 优化错误提示码
    if (emails?.length === 0) {
      throw new UnauthorizedException('emails is empty, invalid oauth');
    }
    const email = emails[0].value;

    // 插入或更新用户（根据 email 判断）
    const newUser = await this.userService.upsert({
      where: { email },
      create: {
        name: displayName,
        uid: genUID(),
        email,
        avatar: photos?.length > 0 ? photos[0].value : undefined,
      },
      update: {}, // 不做任何更新
    });
    this.logger.log(`user upserted: ${newUser.id}`);

    const newAccount = await this.accountService.create({
      type: 'oauth',
      userId: newUser.id,
      provider,
      providerAccountId: id,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
    this.logger.log(`new account created: ${newAccount.id}`);

    return newUser;
  }
}
