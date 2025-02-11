import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseParser, ParserOptions, ParseResult } from './base';

@Injectable()
export class JinaParser extends BaseParser {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly config: ConfigService,
    options: ParserOptions & { apiUrl?: string } = {},
  ) {
    super(options);
    this.apiKey = this.config.getOrThrow('credentials.jina');
    this.apiUrl = options.apiUrl ?? 'https://api.jina.ai/parse';
  }

  async parse(input: string | Buffer): Promise<ParseResult> {
    if (this.options.mockMode) {
      return {
        content: 'Mocked jina content',
        metadata: { source: 'jina' },
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Jina API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content,
        metadata: { ...data.metadata, source: 'jina' },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
