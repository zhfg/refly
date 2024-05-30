import { Source } from './chat';

export class MetaRecord {
  // 分类key，例如 startup_product_research
  key: string;

  // 分类名称，例如: 这个标签涉及创业公司的产品开发、市场定位、用户体验设计和产品管理等方面。这些内容可以帮助创业者了解如何将AI技术转化为实际可用的产品，并在市场上取得成功。
  name: string;

  score: number;

  // 分类原因
  reason: string;
}

export class ContentMeta {
  // 主题
  topics: MetaRecord[];

  // 内容类型 (事实、观点、教程等等)
  contentType?: MetaRecord[];

  // 内容载体（文字、图片、视频等等）
  formats?: MetaRecord[];
}

export class Content {
  id: string;
  title: string;
  abstract: string;
  content?: string; // only returns in detail page
  meta: ContentMeta;
  source: Source[];
}

export class DigestFilter {
  date?: {
    year: number;
    month: number;
    day: number;
  };

  topic?: string;
}

export class DigestListRequest {
  page?: number;

  pageSize?: number;

  filter: DigestFilter;
}

export class ContentDTO {
  id: number;
  title: string;
  abstract: string;
  contentId: number;
  meta: string;
  weblinks: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class Digest extends ContentDTO {
  topicKey: string;
  userId: number;
  date: string;
}

export class Feed extends ContentDTO {
  // 增加一些指标
  readCount?: number; // 阅读次数
  askFollow?: number; // 追问次数
}

export class FeedResponse {
  data: Feed[];
}

export class DigestListResponse {
  data: Digest[];
}
