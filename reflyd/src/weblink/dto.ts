import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  userId?: number;
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
