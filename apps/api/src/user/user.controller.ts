import { Controller, Logger, Get, Body, UseGuards, Put, Query } from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import {
  BaseResponse,
  CheckUsernameResponse,
  UpdateUserSettingsRequest,
  UserSettings,
} from '@refly/openapi-schema';
import { buildSuccessResponse, pick } from '@/utils';
import { User as UserModel } from '@prisma/client';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@User() user: UserModel): UserSettings {
    this.logger.log(`getSettings success, req.user = ${user.email}`);
    return {
      ...pick(user, ['uid', 'avatar', 'name', 'nickname', 'email', 'uiLocale', 'outputLocale']),
      emailVerified: !!user.emailVerified,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('settings')
  async updateSettings(
    @User() user: UserModel,
    @Body() body: UpdateUserSettingsRequest,
  ): Promise<BaseResponse> {
    await this.userService.updateSettings(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('checkUsername')
  async checkUsername(@Query('name') name: string): Promise<CheckUsernameResponse> {
    const user = await this.userService.checkUsername(name);
    return buildSuccessResponse({ available: !user });
  }
}
