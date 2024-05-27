import { RetrieveFilter } from '../conversation/conversation.dto';

export enum ContentType {
  WEBLINK = 'weblink',
}

export interface ContentPayload {
  url: string;
  type: ContentType;
  title: string;
  content: string;
  resourceId?: string;
  collectionId?: string;
}

export interface ContentDataObj extends ContentPayload {
  id: string;
  vector: number[];
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
}
