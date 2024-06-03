import {
  Controller,
  Logger,
  Body,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import {
  GetContentDetailResponse,
  ListDigestRequest,
  ListDigestResponse,
  ListFeedResponse,
} from '@refly/openapi-schema';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AigcService } from './aigc.service';
import { buildSuccessResponse, omit, pick } from '../utils';

@Controller('aigc')
export class AigcController {
  private logger = new Logger(AigcController.name);

  constructor(private aigcService: AigcService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async listFeed(
    @Request() req,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<ListFeedResponse> {
    const feedList = await this.aigcService.getFeedList({
      userId: req.user.id,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
    });
    return buildSuccessResponse(
      feedList.map((feed) => ({
        ...omit(feed, ['weblink', 'inputIds', 'outputIds']),
        contentId: feed.id,
        readCount: 0,
        askFollow: 0,
        weblinks: [feed.weblink],
        createdAt: feed.createdAt.toString(),
        updatedAt: feed.updatedAt.toString(),
      })),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('digest')
  async getDigestList(
    @Request() req,
    @Body() body: ListDigestRequest,
  ): Promise<ListDigestResponse> {
    const digestList = await this.aigcService.getDigestList(req.user.id, body);

    const finalList = await Promise.all(
      digestList.map(async (digest) => {
        return {
          ...pick(digest, ['userId', 'topicKey', 'date']),
          title: digest.content?.title,
          abstract: digest.content?.abstract,
          contentId: digest.contentId,
          cid: '',
          meta: digest.content.meta,
          source: digest.content.sources,
          createdAt: digest.createdAt.toString(),
          updatedAt: digest.updatedAt.toString(),
          weblinks: await this.aigcService.fetchDigestWeblinks(digest.content),
          topic: await this.aigcService.findTopicByKey(digest.topicKey),
        };
      }),
    );

    return buildSuccessResponse(finalList);
  }

  @Get('content/:contentId')
  async getContentDetail(@Param('contentId') contentId: string): Promise<GetContentDetailResponse> {
    const content = await this.aigcService.getContent({
      cid: contentId,
    });
    return buildSuccessResponse({
      ...pick(content, ['cid', 'title', 'abstract', 'meta', 'content']),
      meta: JSON.parse(content.meta),
      source: JSON.parse(content.sources),
      createdAt: content.createdAt.toString(),
      updatedAt: content.updatedAt.toString(),
    });
  }
}
