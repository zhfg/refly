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
import { LlmService } from './llm.service';
import { WeblinkService } from '../weblink/weblink.service';
import { AigcContent } from '@prisma/client';
import { LoggerService } from '../common/logger.service';

@Controller('llm')
export class LLMController {
  constructor(
    private logger: LoggerService,
    private llmService: LlmService,
    private weblinkService: WeblinkService,
  ) {
    this.logger.setContext(LLMController.name);
  }

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
      aigcContentList as AigcContent[],
    );

    return res;
  }
}
