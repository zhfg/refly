import { Document } from '@langchain/core/documents';
import { SourceMeta, WeblinkDTO } from '@refly/openapi-schema';

export type WeblinkJobData = WeblinkDTO & {
  userId?: number; // 是否绑定 user
  retryTimes?: number; // 重试次数
};

export interface WeblinkData {
  html: string;
  doc: Document<SourceMeta>;
}
