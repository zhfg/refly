import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Mark {
  selector: string;
  type: 'text' | 'table' | 'link' | 'image' | 'video' | 'audio';
}

export class Source {
  @ApiProperty()
  pageContent: string;

  @ApiPropertyOptional({ type: [Mark] })
  marks?: Mark[];

  metadata: {
    source: string;
    title: string;
  };

  score: number;
}
