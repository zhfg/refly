import { Injectable } from '@nestjs/common';

export interface ParserOptions {
  format?: string;
  mockMode?: boolean;
  timeout?: number;
}

export interface ParseResult {
  content: string;
  metadata?: Record<string, any>;
  error?: string;
}

@Injectable()
export abstract class BaseParser {
  protected constructor(protected readonly options: ParserOptions = {}) {}

  abstract parse(input: string | Buffer): Promise<ParseResult>;

  protected handleError(error: Error): ParseResult {
    return {
      content: '',
      error: error.message,
    };
  }
}
