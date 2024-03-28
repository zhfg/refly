import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { WeblinkService } from './weblink.service';
import { LlmService } from '../llm/llm.service';
import { GetWebLinkListResponse, StoreWebLinkParam } from './dto';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';

@Controller('weblink')
export class WeblinkController {
  private readonly logger = new Logger(WeblinkController.name);

  constructor(private weblinkService: WeblinkService) {}

  @UseGuards(JwtAuthGuard)
  @Post('store')
  async store(@Request() req, @Body() body: StoreWebLinkParam) {
    this.logger.log(`user: ${req.user.id}, store link: ${body}`);
    await this.weblinkService.storeLinks(req.user.id, body.data);
    return {};
  }

  @Get('getWebContent')
  @ApiQuery({ name: 'url', type: String, required: false })
  async getWebContent(@Query('url') url) {
    this.logger.log(`getWebContent, ${url}`);

    const parseContent = await this.weblinkService.parseWebLinkContent(url); // 处理错误边界
    return parseContent;
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
