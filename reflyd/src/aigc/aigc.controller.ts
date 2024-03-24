import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Content, DigestDetailResponse, FeedResponse } from './dto';

@Controller('aigc')
export class AigcController {
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  @ApiResponse({ type: FeedResponse })
  async listFeed() {
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Get('digest')
  @ApiQuery({ name: 'type', type: String, enum: ['daily'] })
  @ApiQuery({ name: 'y', type: Number, required: false })
  @ApiQuery({ name: 'm', type: Number, required: false })
  @ApiQuery({ name: 'd', type: Number, required: false })
  @ApiQuery({ name: 'needDetail', type: Boolean, required: false })
  @ApiResponse({ type: DigestDetailResponse })
  async getDigestDetail() {
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Get('content/:contentId')
  @ApiResponse({ type: Content })
  async getContentDetail() {
    return {};
  }
}
