import { Controller, Logger, Get, Body, UseGuards, Put, Query } from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import {
  BaseResponse,
  CheckSettingsFieldResponse,
  GetUserSettingsResponse,
  UpdateUserSettingsRequest,
  UserSettings,
} from '@refly-packages/openapi-schema';
import { buildSuccessResponse, pick } from '@/utils';
import { User as UserModel } from '@prisma/client';
import { SubscriptionService } from '@/subscription/subscription.service';
import { subscriptionPO2DTO } from '@/subscription/subscription.dto';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService, private subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings(@User() user: UserModel): Promise<GetUserSettingsResponse> {
    const settings: UserSettings = {
      ...pick(user, ['uid', 'avatar', 'name', 'nickname', 'email', 'uiLocale', 'outputLocale']),
      emailVerified: !!user.emailVerified,
    };

    if (user.subscriptionId) {
      const subscription = await this.subscriptionService.getSubscription(user.subscriptionId);
      settings.subscription = subscriptionPO2DTO(subscription);
    }

    return buildSuccessResponse(settings);
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
  @Get('checkSettingsField')
  async checkSettingsField(
    @User() user: UserModel,
    @Query('field') field: 'name' | 'email',
    @Query('value') value: string,
  ): Promise<CheckSettingsFieldResponse> {
    const result = await this.userService.checkSettingsField(user, { field, value });
    return buildSuccessResponse(result);
  }
}
