import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { User as UserModel } from '@prisma/client';
import {
  MultiLingualWebSearchRequest,
  SearchRequest,
  SearchResponse,
  MultiLingualWebSearchResponse,
} from '@refly-packages/openapi-schema';

import { buildSuccessResponse } from '@/utils';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import { SearchService } from '@/search/search.service';

@Controller('v1/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async search(@User() user: UserModel, @Body() body: SearchRequest): Promise<SearchResponse> {
    return buildSuccessResponse(await this.searchService.search(user, body));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/multilingualSearch')
  async multiLingualWebSearch(
    @User() user: UserModel,
    @Body() body: MultiLingualWebSearchRequest,
  ): Promise<MultiLingualWebSearchResponse> {
    const result = await this.searchService.multiLingualWebSearch(user, body);
    return buildSuccessResponse(result);
  }
}
