import { Injectable } from '@nestjs/common';
import { BaseParser, ParserOptions, ParseResult } from './base';

@Injectable()
export class MarkerParser extends BaseParser {
  private readonly apiUrl: string;

  constructor(options: ParserOptions & { apiUrl?: string } = {}) {
    super(options);
    this.apiUrl = options.apiUrl ?? 'https://api.marker.com/parse';
  }

  async parse(input: string | Buffer): Promise<ParseResult> {
    if (this.options.mockMode) {
      return {
        content: 'Mocked marker content',
        metadata: { source: 'marker' },
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Marker API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content,
        metadata: { ...data.metadata, source: 'marker' },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
