import { ApiProperty } from '@nestjs/swagger';

export class Source {
  @ApiProperty()
  pageContent: string;

  metadata: {
    source: string;
    title: string;
  };

  score: number;
}
