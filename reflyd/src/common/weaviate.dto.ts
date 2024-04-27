// TODO: refactor all these types to rag module

export enum ContentType {
  WEBLINK = 'weblink',
}

export interface ContentDataObj {
  id: string;
  url: string;
  type: ContentType;
  title: string;
  content: string;
  vector: number[];
}

export interface ContentData {
  chunks: ContentDataObj[];
}

export interface MetadataFilter {
  urls?: string[];
}

export interface HybridSearchParam {
  tenantId: string;
  query: string;
  vector?: number[];
  filter?: MetadataFilter;
  limit?: number;
}

export interface SearchMeta {
  score: string;
  explainScore: string;
}

export interface SearchResult {
  url: string;
  type: ContentType;
  title: string;
  content: string;
  _additional: SearchMeta;
}
