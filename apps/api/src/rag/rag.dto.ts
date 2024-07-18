import { RetrieveFilter } from '@refly/openapi-schema';

export enum ContentType {
  WEBLINK = 'weblink',
}

export interface ContentPayload {
  url: string;
  seq: number;
  type: ContentType;
  title: string;
  content: string;
  resourceId?: string;
  collectionId?: string;
}

export interface ContentNode {
  id: string;
  vector: number[];
  payload: ContentPayload;
}

export interface ContentData {
  chunks: ContentNode[];
}

export interface HybridSearchParam {
  query: string;
  vector?: number[];
  filter?: RetrieveFilter;
  limit?: number;
}

export interface ReaderResult {
  code: number;
  status: number;
  data: {
    title: string;
    url: string;
    content: string;
    publishedTime?: string;
  };
}

export interface DocMeta {
  title?: string;
  url?: string;
  collectionId?: string;
  resourceId?: string;
}
