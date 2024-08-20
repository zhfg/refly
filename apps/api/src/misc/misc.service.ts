import { Injectable } from '@nestjs/common';
import { ScrapeWeblinkRequest, ScrapeWeblinkResult } from '@refly/openapi-schema';
import { load } from 'cheerio';

@Injectable()
export class MiscService {
  constructor() {}

  async scrapeWeblink(body: ScrapeWeblinkRequest): Promise<ScrapeWeblinkResult> {
    const { url } = body;
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);

    // Get OG title
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();

    // Get OG description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content');

    // Get OG image or first suitable image
    let image = $('meta[property="og:image"]').attr('content');
    if (!image) {
      // If no og:image exists, pick the first image starts with http or https
      $('img').each((index, element) => {
        const src = $(element).attr('src');
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          image = src;
          return false; // break forEach loop
        }
      });
    }

    return {
      title,
      description,
      image,
    };
  }
}
