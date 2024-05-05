import _ from 'lodash';
import { Controller, Logger, Get, Post, Query, Request, UseGuards, Body } from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { WeblinkService } from './weblink.service';
import {
  GetWebLinkListResponse,
  PingWeblinkData,
  PingWeblinkResponse,
  StoreWebLinkParam,
} from './weblink.dto';
import { PARSER_VERSION } from '../rag/rag.service';
import { normalizeURL } from '../utils/url';

@Controller('weblink')
export class WeblinkController {
  private logger = new Logger(WeblinkController.name);
  constructor(private weblinkService: WeblinkService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('ping')
  async ping(@Query('url') url: string): Promise<PingWeblinkResponse> {
    url = normalizeURL(url);
    if (!url) {
      return {
        data: { parseStatus: 'unavailable', chunkStatus: 'unavailable' },
      };
    }

    const weblink = await this.weblinkService.findFirstWeblink({ url });

    // If weblink not exists, the storage key is not complete
    // or has outdated parser version then reprocess it asynchronously
    if (!weblink || (weblink.chunkStatus === 'finish' && weblink.parserVersion < PARSER_VERSION)) {
      await this.weblinkService.enqueueProcessTask({ url });
      return { data: { parseStatus: 'processing', chunkStatus: 'processing' } };
    }

    const data: Partial<PingWeblinkData> = _.pick(
      weblink,
      'linkId',
      'parseStatus',
      'chunkStatus',
      'parseSource',
    );

    if (weblink.summary) data.summary = weblink.summary;
    if (weblink.relatedQuestions.length > 0) data.relatedQuestions = weblink.relatedQuestions;

    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('store')
  async store(@Request() req, @Body() body: StoreWebLinkParam) {
    this.logger.log(`user: ${req.user.id}, store link: ${body}`);
    await this.weblinkService.storeLinks(req.user.uid, body.data);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  @ApiQuery({ name: 'linkId', type: String, required: false })
  @ApiQuery({ name: 'url', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  @ApiOkResponse({ type: GetWebLinkListResponse })
  async list(
    @Request() req,
    @Query('linkId') linkId,
    @Query('url') url,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    page = Number(page);
    pageSize = Number(pageSize);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    this.logger.log(
      `weblink list where: ${JSON.stringify({
        linkId,
        url,
        userId: req.user.id,
      })}`,
    );
    const weblinkList = await this.weblinkService.getUserHistory({
      skip,
      take,
      where: { id: linkId, url, userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: weblinkList,
    };
  }
}
