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
import { LlmService } from './llm.service';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { WeblinkService } from '../weblink/weblink.service';
import { AIGCContent } from '@prisma/client';

@Controller('llm')
export class LLMController {
  private readonly logger = new Logger(LLMController.name);

  constructor(
    private llmService: LlmService,
    private weblinkService: WeblinkService,
  ) {}

  @Post('applyStrategy')
  async store(@Request() req, @Body() body: { url: string }) {
    this.logger.log(`applyStrategy: ${body}`);

    const { url } = body;
    const doc = await this.weblinkService.parseWebLinkContent(url); // 处理错误边界
    const res = await this.llmService.applyStrategy(doc);

    return res;
  }

  @Post('applyStrategy')
  async applyStrategy(@Request() req, @Body() body: { url: string }) {
    this.logger.log(`applyStrategy: ${body}`);

    const { url } = body;
    const doc = await this.weblinkService.parseWebLinkContent(url); // 处理错误边界
    const res = await this.llmService.applyStrategy(doc);

    return res;
  }

  @Post('extractContentMeta')
  async extractContentMeta(@Request() req, @Body() body: { url: string }) {
    this.logger.log(`extractContentMeta: ${body}`);

    const { url } = body;
    const doc = await this.weblinkService.parseWebLinkContent(url); // 处理错误边界
    const res = await this.llmService.extractContentMeta(doc);

    return res;
  }

  @Post('summarizeMultipleWeblink')
  async summarizeMultipleWeblink(
    @Request() req,
    @Body() body: { urls: string[] },
  ) {
    this.logger.log(`summarizeMultipleWeblink: ${body}`);

    const { urls } = body;
    const contentList = await Promise.all(
      urls.map(async (item) => {
        const doc = await this.weblinkService.parseWebLinkContent(item); // 处理错误边界

        // TODO: 这里需要结合 meta + content 来进行多个网页的总结
        const contentMeta = await this.llmService.extractContentMeta(doc);
        const aigcContent = await this.llmService.applyStrategy(doc);

        return { aigcContent, contentMeta };
      }),
    );

    const aigcContentList = contentList.map((item) => item.aigcContent);
    const res = await this.llmService.summarizeMultipleWeblink(
      aigcContentList as AIGCContent[],
    );

    return res;
  }
}
