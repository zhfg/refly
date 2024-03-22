import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listFeed() {
    return {};
  }
}
