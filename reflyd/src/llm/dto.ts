export class MetaRecord {
  key: string;
  score: string;
}

export class ContentMeta {
  // 主题
  topics: MetaRecord[];
  // 内容类型 (事实、观点、教程等等)
  contentType: MetaRecord[];
  // 内容载体（文字、图片、视频等等）
  formats: MetaRecord[];

  /**
   * 是否需要构建 RAG 索引
   */
  needIndex(): boolean {
    return true;
  }
}
