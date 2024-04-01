import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import {
  Content,
  DigestListRequest,
  DigestListResponse,
  FeedResponse,
} from './aigc.dto';
import { AigcService } from './aigc.service';

@Controller('aigc')
export class AigcController {
  constructor(private aigcService: AigcService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  @ApiResponse({ type: FeedResponse })
  async listFeed(
    @Request() req,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<FeedResponse> {
    const feedList = await this.aigcService.getFeedList({
      userId: req.user.id,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
    });
    return {
      data: feedList.map((feed) => ({
        ...feed,
        contentId: feed.id,
        meta: JSON.parse(feed.meta),
        source: JSON.parse(feed.sources),
        readCount: 0,
        askFollow: 0,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('digest')
  @ApiBody({ type: DigestListRequest })
  @ApiResponse({ type: DigestListResponse })
  async getDigestList(@Request() req): Promise<DigestListResponse> {
    const digestList = await this.aigcService.getDigestList({
      userId: req.user.id,
      ...req.body,
    });

    return {
      data: digestList.map((digest) => ({
        id: digest.id,
        userId: digest.userId,
        topicKey: digest.topicKey,
        date: digest.date,
        title: digest.content?.title,
        abstract: digest.content?.abstract,
        contentId: digest.contentId,
        meta: JSON.parse(digest.content.meta),
        source: JSON.parse(digest.content.sources || '{}'),
        createdAt: digest.createdAt,
        updatedAt: digest.updatedAt,
      })),
    };
  }

  @Get('content/:contentId')
  @ApiResponse({ type: Content })
  async getContentDetail(@Param('contentId') contentId: string) {
    const content = await this.aigcService.getContent({ contentId });
    return { data: content };
  }
}
