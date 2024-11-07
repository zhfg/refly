import pLimit from 'p-limit';
import { Source } from '@refly-packages/openapi-schema';

interface WebSearchParams {
  query: string;
  locale: string;
  limit: number;
  user: any;
  engine: any;
}

interface WebSearchBatch {
  queries: string[];
  locale: string;
  limit: number;
  user: any;
  engine: any;
}

// Helper function to perform web search for a single query
const performWebSearch = async ({ query, locale, limit, user, engine }: WebSearchParams): Promise<Source[]> => {
  const result = await engine.service.webSearch(user, {
    query,
    limit,
    locale,
  });

  return result.data.map((item) => ({
    url: item.url,
    title: item.name,
    pageContent: item.snippet,
    metadata: {
      originalLocale: locale,
      originalQuery: query,
    },
  }));
};

// Main function to handle concurrent web searches
export const performConcurrentWebSearch = async ({
  queryMap,
  searchLimit,
  concurrencyLimit,
  user,
  engine,
}: {
  queryMap: Record<string, string[]>; // locale -> queries
  searchLimit: number;
  concurrencyLimit: number;
  user: any;
  engine: any;
}): Promise<Source[]> => {
  // Initialize concurrency limiter
  const limit = pLimit(concurrencyLimit);

  // Create search tasks for all queries across all locales
  const searchTasks = Object.entries(queryMap).flatMap(([locale, queries]) =>
    queries.map((query) =>
      limit(() =>
        performWebSearch({
          query,
          locale,
          limit: searchLimit,
          user,
          engine,
        }),
      ),
    ),
  );

  try {
    // Execute all search tasks with concurrency control
    const results = await Promise.all(searchTasks);

    // Flatten results array
    return results.flat();
  } catch (error) {
    throw new Error(`Web search failed: ${error.message}`);
  }
};
