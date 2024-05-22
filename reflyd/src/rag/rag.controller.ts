import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Controller, Get, Param, Render, Logger } from '@nestjs/common';
import { RAGService } from './rag.service';
import { sha256Hash } from 'src/utils';

@Controller('rag')
export class RagController {
  private logger = new Logger(RagController.name);

  constructor(private ragService: RAGService) {}

  @Get('parse/:url(*)')
  @Render('parse')
  async parse(@Param('url') url: string) {
    const cacheFile = path.join(await fs.realpath(os.tmpdir()), sha256Hash(url) + '.json');
    this.logger.log('looking for cache file ' + cacheFile);

    let snapshot;

    // check cacheFile exists
    const cacheExists = await fs.access(cacheFile).then(
      () => true,
      () => false,
    );

    if (cacheExists) {
      this.logger.log(`found cache for ${url}, reading from ${cacheFile}`);
      snapshot = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    } else {
      snapshot = await this.ragService.crawl(url);
      await fs.writeFile(cacheFile, JSON.stringify(snapshot));
      this.logger.log('save cache to ' + cacheFile);
    }

    const content = snapshot.parsed?.content || snapshot.html;
    const markdownText = await this.ragService.convertHTMLToMarkdown('ingest', content);
    const chunks = await this.ragService.chunkText(markdownText);

    return { url, doc: markdownText, chunks: chunks };
  }

  @Get('parse')
  @Render('parse')
  empty() {
    return {};
  }
}
