import { Controller, Logger, Get, Body, Request, UseGuards, Put } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserService } from './user.service';
import {
  BaseResponse,
  GetUserTopicsResponse,
  UpdateUserSettingsRequest,
  UserSettings,
} from '@refly/openapi-schema';
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

  @UseGuards(JwtAuthGuard)
  @Get('topics')
  async getTopicList(@Request() req): Promise<GetUserTopicsResponse> {
    const topics = await this.userService.getUserPreferences({
      userId: req.user.id,
    });
    const topicCnt = await this.userService.countUserPreferences({
      userId: req.user.id,
    });

    return buildSuccessResponse({
      list: topics.map((topic) => ({
        ...pick(topic, ['score', 'topicKey']),
        topic: {
          ...pick(topic.topic, ['topicId', 'key', 'name', 'description']),
          createdAt: topic.createdAt.toJSON(),
          updatedAt: topic.updatedAt.toJSON(),
        },
        createdAt: topic.createdAt.toJSON(),
        updatedAt: topic.updatedAt.toJSON(),
      })),
      total: topicCnt,
    });
  }
}
