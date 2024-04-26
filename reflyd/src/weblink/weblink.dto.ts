import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document } from '@langchain/core/documents';
import { IndexStatus } from '@prisma/client';

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

  userId?: number; // 是否绑定 user，如果不绑定就走不去存向量，绑定了就存向量
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
  @ApiProperty()
  status: 'ok' | 'unavailable';
}
