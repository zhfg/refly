import { Controller, Logger, Get, Body, UseGuards, Put, Query } from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import {
  BaseResponse,
  CheckSettingsFieldResponse,
  GetUserSettingsResponse,
  UpdateUserSettingsRequest,
} from '@refly/openapi-schema';
import { buildSuccessResponse, pick } from '@/utils';
import { User as UserModel } from '@prisma/client';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@User() user: UserModel): GetUserSettingsResponse {
    this.logger.log(`getSettings success, req.user = ${user.email}`);
    const settings = {
      ...pick(user, ['uid', 'avatar', 'name', 'nickname', 'email', 'uiLocale', 'outputLocale']),
      emailVerified: !!user.emailVerified,
    };
    return { success: true, data: settings, ...settings };
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
