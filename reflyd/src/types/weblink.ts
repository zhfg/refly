import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Selection {
  xPath: string;
  content: string;
  type: 'text' | 'table' | 'link' | 'image' | 'video' | 'audio';
}

export class PageMeta {
  source: string;
  title: string;
}

export class Source {
  @ApiProperty()
  pageContent: string;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  selections?: Selection[];
}
