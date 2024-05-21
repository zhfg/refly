import { RetrieveFilter } from '../conversation/conversation.dto';

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
  resourceId?: string;
  collectionId?: string;
}

export interface ContentData {
  chunks: ContentDataObj[];
}

export interface HybridSearchParam {
  query: string;
  vector?: number[];
  filter?: RetrieveFilter;
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
