import { SkillRunnableConfig } from '../../base';
import { Source } from '@refly-packages/openapi-schema';
import { BaseSkill } from '../../base';
import pLimit from 'p-limit';
// Import linkify-it and tlds
import LinkifyIt from 'linkify-it';
import tlds from 'tlds';

// 默认的并发限制和批处理大小
const DEFAULT_CONCURRENCY_LIMIT = 5;
const DEFAULT_BATCH_SIZE = 8;

// Initialize linkify-it with all TLDs
const linkify = new LinkifyIt();
// Add all top-level domains and enable fuzzy IP detection
linkify.tlds(tlds).set({ fuzzyIP: true, fuzzyLink: true });

/**
 * Validates URL using built-in Node.js URL class
 * @param url The URL string to validate
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    // Check if URL can be constructed (validates format)
    new URL(url);
    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Extract URLs from text using linkify-it
 * Much faster and more reliable than regex or AI-based extraction
 * @param query The text to extract URLs from
 * @returns Object with detected URLs and whether URLs were found
 */
export function extractUrlsWithLinkify(query: string): {
  hasUrls: boolean;
  detectedUrls: string[];
} {
  if (!query) {
    return { hasUrls: false, detectedUrls: [] };
  }

  // Find all links in text
  const matches = linkify.match(query);

  if (!matches || matches.length === 0) {
    return { hasUrls: false, detectedUrls: [] };
  }

  // Extract URLs and normalize them
  const detectedUrls = matches
    .map((match) => {
      // Get the raw URL
      let url = match.url;

      // If schema is missing, add https://
      if (!match.schema) {
        url = `https://${url}`;
      }

      return url;
    })
    .filter(isValidUrl); // Filter out any URLs that aren't valid

  return {
    hasUrls: detectedUrls.length > 0,
    detectedUrls,
  };
}

// Helper to chunk array into batches
const chunk = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};

/**
 * Crawl a single URL and format it as a source
 * @param url URL string to crawl
 * @param user User for the crawl request
 * @param engine SkillEngine with access to crawl service
 * @param logger Logger for reporting progress
 * @returns Source object with content from the URL or null on failure
 */
async function crawlSingleUrl(
  url: string,
  user: any,
  engine: any,
  logger: any,
): Promise<Source | null> {
  try {
    // Verify URL is valid using Node.js URL API
    if (!isValidUrl(url)) {
      logger.warn(`Skipping invalid URL: ${url}`);
      return null;
    }

    const result = await engine.service.crawlUrl(user, url);

    if (result?.content) {
      return {
        pageContent: result.content,
        metadata: {
          source: url,
          title: result.title || url,
          // Use type assertion to allow custom properties
          ...(result.metadata || {}),
        } as any,
        url,
        title: result.title || url,
      };
    }

    if (logger) {
      logger.warn(`URL crawled but no content returned: ${url}`);
    }
    return null;
  } catch (error) {
    if (logger) {
      logger.error(`Failed to crawl URL ${url}: ${error}`);
    }
    return null;
  }
}

/**
 * Crawl URLs extracted from a query and format them as sources
 * @param urls Array of URLs to crawl
 * @param config The skill runnable configuration
 * @param skill The BaseSkill instance with access to the engine
 * @param options Optional configuration for concurrency and batch size
 * @returns Array of sources with content from the URLs
 */
export async function crawlExtractedUrls(
  urls: string[],
  config: SkillRunnableConfig,
  skill: BaseSkill,
  options?: {
    concurrencyLimit?: number;
    batchSize?: number;
  },
): Promise<Source[]> {
  if (!urls || urls.length === 0) {
    return [];
  }

  const { user } = config.configurable;
  const engine = skill.engine;
  const logger = engine.logger;

  if (!engine || !engine.service || !engine.service.crawlUrl) {
    if (logger) {
      logger.error('Crawl URL service not available');
    }
    return [];
  }

  // Set up concurrency control
  const concurrencyLimit = options?.concurrencyLimit || DEFAULT_CONCURRENCY_LIMIT;
  const limit = pLimit(concurrencyLimit);

  // Filter out invalid URLs
  const validUrls = urls.filter((url) => isValidUrl(url));
  if (validUrls.length < urls.length) {
    logger.warn(`Filtered out ${urls.length - validUrls.length} invalid URLs`);
  }

  // Split URLs into batches for processing
  const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE;
  const batches = chunk(validUrls, batchSize);

  logger.log(
    `Starting to crawl ${validUrls.length} URLs with concurrency limit of ${concurrencyLimit} in ${batches.length} batches`,
  );

  const sources: Source[] = [];

  // Process each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    logger.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} URLs`);

    // Process URLs in each batch concurrently
    const batchResults = await Promise.all(
      batch.map((url) => limit(() => crawlSingleUrl(url, user, engine, logger))),
    );

    // Filter out failed crawls and add to sources
    const validResults = batchResults.filter(Boolean) as Source[];
    sources.push(...validResults);

    logger.log(
      `Completed batch ${i + 1}/${batches.length}: ${validResults.length}/${batch.length} URLs successfully crawled`,
    );
  }

  return sources;
}

/**
 * Extract URLs from a query, crawl them, and return as sources
 * Uses linkify-it for efficient URL extraction without AI
 * @param query The user's query text
 * @param config The skill runnable configuration
 * @param skill The BaseSkill instance
 * @param model The language model to use (unused but kept for API compatibility)
 * @returns Array of sources with content from the URLs
 */
export async function extractAndCrawlUrls(
  query: string,
  config: SkillRunnableConfig,
  skill: BaseSkill,
  options?: {
    concurrencyLimit?: number;
    batchSize?: number;
  },
): Promise<{
  sources: Source[];
  analysis: { hasUrls: boolean; queryIntent: string };
}> {
  const logger = skill.engine.logger;

  // Use linkify-it for fast and reliable URL extraction
  const { hasUrls, detectedUrls } = extractUrlsWithLinkify(query);

  if (!hasUrls) {
    // If no URLs detected, return empty result
    logger.log('No URLs detected with linkify-it');
    return {
      sources: [],
      analysis: {
        hasUrls: false,
        queryIntent: query,
      },
    };
  }

  logger.log(
    `Detected ${detectedUrls.length} URLs with linkify-it: ${JSON.stringify(detectedUrls)}`,
  );

  // Crawl the extracted URLs
  const sources = await crawlExtractedUrls(detectedUrls, config, skill, options);

  return {
    sources,
    analysis: {
      hasUrls: Boolean(sources.length),
      queryIntent: query, // Use query directly as intent
    },
  };
}
