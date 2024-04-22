import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document } from '@langchain/core/documents';
import { IndexStatus } from '@prisma/client';

export class WebLinkDTO {
  @ApiProperty()
  lastVisitTime: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  origin: string;

  @ApiProperty()
  originPageTitle: string;

  @ApiProperty()
  originPageUrl: string;

  @ApiProperty()
  originPageDescription: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  visitCount?: number;

  @ApiPropertyOptional()
  readTime?: number;

  @ApiPropertyOptional()
  pageContent?: string; // 反爬网站前端传入

  @ApiPropertyOptional()
  storageKey?: string; // 前端上传 html 拿到的 object key

  userId?: number;

  parsedDoc?: Document; // 服务端解析出的 Document
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
