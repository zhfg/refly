import { Controller, Logger, Get, Body, Request, UseGuards, Put } from '@nestjs/common';
import { pick } from 'lodash';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateSettingsDTO } from './user.dto';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@Request() req) {
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
  async updateSettings(@Request() req, @Body() body: UpdateSettingsDTO) {
    await this.userService.updateSettings(req.user.id, body);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('topics')
  async getTopicList(@Request() req) {
    const topics = await this.userService.getUserPreferences({
      userId: req.user.id,
    });
    const topicCnt = await this.userService.countUserPreferences({
      userId: req.user.id,
    });

    return {
      data: {
        list: topics,
        total: topicCnt,
      },
    };
  }
}
