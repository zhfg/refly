import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetaRecord {
  // 分类key，例如 startup_product_research
  @ApiProperty()
  key: string;

  // 分类名称，例如: 这个标签涉及创业公司的产品开发、市场定位、用户体验设计和产品管理等方面。这些内容可以帮助创业者了解如何将AI技术转化为实际可用的产品，并在市场上取得成功。
  @ApiProperty()
  name: string;

  @ApiProperty()
  score: number;

  // 分类原因
  reason: string;
}

export class ContentMeta {
  // 主题
  @ApiProperty({ type: [MetaRecord] })
  topics: MetaRecord[];

  // 内容类型 (事实、观点、教程等等)
  @ApiPropertyOptional({ type: [MetaRecord] })
  contentType?: MetaRecord[];

  @ApiPropertyOptional({ type: [MetaRecord] })
  // 内容载体（文字、图片、视频等等）
  formats?: MetaRecord[];
}
