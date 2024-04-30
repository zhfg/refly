import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document } from '@langchain/core/documents';
import { IndexStatus, ParseSource } from '@prisma/client';
import { PageMeta, Source } from '../types/weblink';

export class WebLinkDTO {
  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  origin?: string;

  @ApiPropertyOptional()
  originPageTitle?: string;

  @ApiPropertyOptional()
  originPageUrl?: string;

  @ApiPropertyOptional()
  originPageDescription?: string;

  @ApiPropertyOptional()
  visitCount?: number;

  @ApiPropertyOptional()
  lastVisitTime?: number;

  @ApiPropertyOptional()
  readTime?: number;

  @ApiPropertyOptional()
  pageContent?: string; // 反爬网站前端传入

  @ApiPropertyOptional()
  storageKey?: string; // 前端上传 html 拿到的 object key

  userId?: number; // 是否绑定 user
}

export class StoredWebLink extends WebLinkDTO {
  @ApiProperty()
  indexStatus: IndexStatus;
}

export class StoreWebLinkParam {
  @ApiProperty({ type: [WebLinkDTO] })
  data: WebLinkDTO[];
}

export class GetWebLinkListResponse {
  @ApiProperty({ type: [StoredWebLink] })
  data: StoredWebLink[];
}

export class PingWeblinkResponse {
  @ApiPropertyOptional()
  linkId?: string;

  @ApiPropertyOptional()
  parseStatus?: IndexStatus | 'unavailable';

  @ApiPropertyOptional()
  chunkStatus?: IndexStatus | 'unavailable';

  @ApiProperty()
  summary?: string;

  @ApiPropertyOptional()
  relatedQuestions?: string[];

  @ApiPropertyOptional()
  parseSource?: ParseSource;
}

export class SummaryWeblinkParam {
  @ApiProperty()
  weblink: Source;
}

export interface WeblinkData {
  html: string;
  doc: Document<PageMeta>;
}
