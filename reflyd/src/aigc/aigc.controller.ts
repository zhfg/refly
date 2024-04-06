import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import omit from 'lodash.omit';
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
        ...omit(feed, 'weblink', 'inputIds', 'outputIds'),
        contentId: feed.id,
        readCount: 0,
        askFollow: 0,
        weblinks: [feed.weblink],
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

    const finalList = await Promise.all(
      digestList.map(async (digest) => {
        return {
          id: digest.id,
          userId: digest.userId,
          topicKey: digest.topicKey,
          date: digest.date,
          title: digest.content?.title,
          abstract: digest.content?.abstract,
          contentId: digest.contentId,
          meta: digest.content.meta,
          source: digest.content.sources,
          createdAt: digest.createdAt,
          updatedAt: digest.updatedAt,
          weblinks: await this.aigcService.fetchDigestWeblinks(digest.content),
          topic: await this.aigcService.findTopicByKey(digest.topicKey),
        };
      }),
    );

    return {
      data: finalList,
    };
  }

  @Get('content/:contentId')
  @ApiResponse({ type: Content })
  async getContentDetail(@Param('contentId') contentId: string) {
    const content = await this.aigcService.getContent({
      contentId: Number(contentId),
    });
    return { data: content };
  }
}
