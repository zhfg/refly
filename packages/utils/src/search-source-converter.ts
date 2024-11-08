import { SearchDomain, SearchResult, SearchResultMeta, Source, SourceMeta } from '@refly-packages/openapi-schema';

// Helper function to generate unique key for a source
const getSourceKey = (source: Source): string => {
  return `${source.url || ''}::${source.title || ''}::${source.pageContent}`;
};

export const mergeSearchResults = (results: Source[]): Source[] => {
  // Use Map to store unique sources, with composite key
  const sourceMap = new Map<string, Source>();

  results.forEach((source) => {
    const key = getSourceKey(source);

    if (!sourceMap.has(key)) {
      // If source doesn't exist, add it
      sourceMap.set(key, source);
    } else {
      // If source exists, merge metadata and selections if present
      const existingSource = sourceMap.get(key)!;

      // Merge metadata if exists
      if (source.metadata && existingSource.metadata) {
        existingSource.metadata = {
          ...existingSource.metadata,
          ...source.metadata,
        };
      }

      // Merge selections if exists
      if (source.selections?.length) {
        existingSource.selections = [...(existingSource.selections || []), ...source.selections];
      }

      // Keep higher score if exists
      if (source.score !== undefined && (existingSource.score === undefined || source.score > existingSource.score)) {
        existingSource.score = source.score;
      }
    }
  });

  // Convert Map back to array and sort by score if available
  return Array.from(sourceMap.values()).sort((a, b) => {
    if (a.score === undefined && b.score === undefined) return 0;
    if (a.score === undefined) return 1;
    if (b.score === undefined) return -1;
    return b.score - a.score;
  });
};

// Helper function to convert Source[] to SearchResult[]
export const sourcesToSearchResults = (sources: Source[]): SearchResult[] => {
  return sources.map((source) => ({
    id: source.url || '', // Use URL as ID for web sources
    domain: 'resource' as SearchDomain, // Web search results are treated as resources
    title: source.title || '',
    snippets: [
      {
        text: source.pageContent || '',
        highlights: [],
      },
    ],
    relevanceScore: source.score, // Preserve existing score if any
    metadata: {
      ...source.metadata,
      url: source.url,
    } as any as SearchResultMeta,
  }));
};

// Helper function to convert SearchResult[] back to Source[]
export const searchResultsToSources = (results: SearchResult[]): Source[] => {
  return results.map((result) => ({
    url: result.metadata?.['url'] || '',
    title: result.title,
    pageContent: result.snippets?.[0]?.text || '',
    score: result.relevanceScore, // Map relevanceScore to score
    metadata: {
      ...result.metadata,
      score: result.relevanceScore, // Also store in metadata for consistency
    } as any as SourceMeta,
  }));
};
