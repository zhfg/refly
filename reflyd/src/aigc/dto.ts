import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Source } from '../types/weblink';
import { ContentMeta } from '../llm/dto';

export class Content {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  abstract: string;

  @ApiPropertyOptional()
  content?: string; // only returns in detail page

  @ApiProperty()
  meta: ContentMeta;

  @ApiProperty({ type: [Source] })
  source: Source[];
}

export class FeedResponse {
  @ApiProperty({ type: [Content] })
  data: Content[];

  @ApiProperty()
  nextCursor: number;

  @ApiProperty()
  hasNext: boolean;
}

export class DigestListResponse {}

export class DigestDetailResponse {
  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  @ApiProperty()
  day: number;

  @ApiProperty()
  week: number;

  @ApiPropertyOptional({ type: [Content] })
  data: Content[];
}
