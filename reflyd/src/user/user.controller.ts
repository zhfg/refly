import { Controller, Get, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserService } from './user.service';
import { LoggerService } from '../common/logger.service';

@Controller('user')
export class UserController {
  constructor(private logger: LoggerService, private userService: UserService) {
    this.logger.setContext(UserController.name);
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
