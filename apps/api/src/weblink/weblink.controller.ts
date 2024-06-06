import _ from 'lodash';
import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { WeblinkService } from './weblink.service';
import {
  BaseResponse,
  ListWeblinkResponse,
  PingWeblinkData,
  PingWeblinkResponse,
  StoreWeblinkRequest,
} from '@refly/openapi-schema';
import { PARSER_VERSION } from '../rag/rag.service';
import { normalizeURL } from '../utils/url';
import { buildSuccessResponse, pick } from '../utils';

@Controller('weblink')
export class WeblinkController {
  private logger = new Logger(WeblinkController.name);
  constructor(private weblinkService: WeblinkService) {}

  @UseGuards(JwtAuthGuard)
  @Get('ping')
  async ping(@Query('url') url: string): Promise<PingWeblinkResponse> {
    url = normalizeURL(url);
    if (!url) {
      return buildSuccessResponse({ parseStatus: 'unavailable', chunkStatus: 'unavailable' });
    }

    const weblink = await this.weblinkService.findFirstWeblink({ url });

    // If weblink not exists, the storage key is not complete
    // or has outdated parser version then reprocess it asynchronously
    if (!weblink || (weblink.chunkStatus === 'finish' && weblink.parserVersion < PARSER_VERSION)) {
      await this.weblinkService.enqueueProcessTask({ url });
      return buildSuccessResponse({ parseStatus: 'processing', chunkStatus: 'processing' });
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

    return buildSuccessResponse(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('store')
  async store(@Request() req, @Body() body: StoreWeblinkRequest): Promise<BaseResponse> {
    this.logger.log(`user: ${req.user.id}, store link: ${body}`);
    await this.weblinkService.storeLinks(req.user.id, body.data);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list(
    @Request() req,
    @Query('linkId') linkId: string,
    @Query('url') url: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListWeblinkResponse> {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    this.logger.log(
      `weblink list where: ${JSON.stringify({
        linkId,
        url,
        userId: req.user.id,
      })}`,
    );
    const weblink = await this.weblinkService.findFirstWeblink({ url, linkId });
    if (!weblink) {
      return buildSuccessResponse([]);
    }

    const weblinkList = await this.weblinkService.getUserHistory({
      skip,
      take,
      where: { weblinkId: weblink.id, userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return buildSuccessResponse(
      weblinkList.map((w) => ({
        ...pick(w, ['url', 'origin', 'originPageUrl', 'originPageTitle', 'totalReadTime']),
        lastVisitTime: Math.floor(w.lastVisitTime.getTime() / 1000),
        createdAt: w.createdAt.toJSON(),
        updatedAt: w.updatedAt.toJSON(),
      })),
    );
  }
}
