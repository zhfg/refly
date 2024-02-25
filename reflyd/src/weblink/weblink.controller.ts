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
import { GetWebLinkListResponse, StoreWebLinkParam } from './dto';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';

@Controller('weblink')
export class WeblinkController {
  private readonly logger = new Logger(WeblinkController.name);

  constructor(private weblinkService: WeblinkService) {}

  // @UseGuards(JwtAuthGuard)
  @Post('store')
  async store(@Body() body: StoreWebLinkParam) {
    this.logger.log('link:', body);
    await this.weblinkService.storeLinks(body.data);
    return {};
  }

  // @UseGuards(JwtAuthGuard)
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

    const weblinkList = await this.weblinkService.findMany({
      skip,
      take,
      where: { linkId, url },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: weblinkList,
    };
  }
}
