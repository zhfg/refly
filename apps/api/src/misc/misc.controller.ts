import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { MiscService } from '@/misc/misc.service';
import { ScrapeWeblinkRequest, ScrapeWeblinkResponse } from '@refly/openapi-schema';
import { buildSuccessResponse } from '@/utils';

@Controller('misc')
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @UseGuards(JwtAuthGuard)
  @Post('scrape')
  async scrapeWeblink(@Body() body: ScrapeWeblinkRequest): Promise<ScrapeWeblinkResponse> {
    const result = await this.miscService.scrapeWeblink(body);
    return buildSuccessResponse(result);
  }
}
