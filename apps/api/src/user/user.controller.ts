import { Controller, Logger, Get, Body, Request, UseGuards, Put } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserService } from './user.service';
import { BaseResponse, UpdateUserSettingsRequest, UserSettings } from '@refly/openapi-schema';
import { buildSuccessResponse, pick } from '../utils';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@Request() req): UserSettings {
    this.logger.log(`getSettings success, req.user = ${req.user.email}`);
    return pick(req.user, [
      'uid',
      'avatar',
      'name',
      'email',
      'emailVerified',
      'uiLocale',
      'outputLocale',
    ]);
  }

  @UseGuards(JwtAuthGuard)
  @Put('settings')
  async updateSettings(
    @Request() req,
    @Body() body: UpdateUserSettingsRequest,
  ): Promise<BaseResponse> {
    await this.userService.updateSettings(req.user.id, body);
    return buildSuccessResponse();
  }
}
