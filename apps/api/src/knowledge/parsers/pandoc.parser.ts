import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { BaseParser, ParserOptions, ParseResult } from './base';

@Injectable()
export class PandocParser extends BaseParser {
  constructor(options: ParserOptions = {}) {
    super({
      format: 'markdown',
      timeout: 30000,
      ...options,
    });
  }

  async parse(input: string | Buffer): Promise<ParseResult> {
    if (this.options.mockMode) {
      return {
        content: 'Mocked pandoc content',
        metadata: { format: this.options.format },
      };
    }

    try {
      const pandoc = spawn('pandoc', ['-f', this.options.format, '-t', 'markdown']);

      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        pandoc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pandoc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pandoc.on('close', (code) => {
          if (code === 0) {
            resolve({
              content: stdout,
              metadata: { format: this.options.format },
            });
          } else {
            reject(new Error(`Pandoc failed with code ${code}: ${stderr}`));
          }
        });

        pandoc.on('error', (error) => {
          reject(error);
        });

        // Handle timeout
        const timeout = setTimeout(() => {
          pandoc.kill();
          reject(new Error(`Pandoc process timed out after ${this.options.timeout}ms`));
        }, this.options.timeout);

        pandoc.on('close', () => {
          clearTimeout(timeout);
        });

        // Write input to stdin and close it
        pandoc.stdin.write(input);
        pandoc.stdin.end();
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
