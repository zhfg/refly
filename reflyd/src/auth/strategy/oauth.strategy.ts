import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile } from 'passport';

export function OAuthStrategy(strategy: any, name?: string) {
  return class extends PassportStrategy(strategy, name) {
    async validate(
      accessToken: string,
      refreshToken: string,
      profile: Profile,
    ) {
      this.logger.log(
        `oauth validate, accessToken: ${accessToken}, refreshToken: ${refreshToken}, profile: ${profile}`,
      );
      const { provider, id, emails, username, photos } = profile;

      // 先查找是否存在认证记录
      const account = await this.accountService.findUnique({
        provider_providerAccountId: {
          provider,
          providerAccountId: id,
        },
      });

      // 如果有认证账户，且存在对应的用户，则直接返回
      if (account) {
        this.logger.log(
          `account found for provider ${provider}, account id: ${id}`,
        );
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
      if (emails.length === 0) {
        throw new UnauthorizedException('emails is empty, invalid oauth');
      }

      const newUser = await this.userService.create({
        name: username,
        email: emails[0].value,
        avatar: photos[0].value,
      });
      this.logger.log(`new user created: ${newUser.id}`);

      const newAccount = await this.accountService.create({
        type: 'oauth',
        userId: newUser.id,
        provider: 'github',
        providerAccountId: id,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      this.logger.log(`new account created: ${newAccount.id}`);

      return newUser;
    }
  };
}
