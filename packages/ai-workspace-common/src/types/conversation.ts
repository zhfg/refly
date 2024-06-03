import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import type { Message, ServerMessage } from './message';

/**
 * @deprecated
 */
export type Conversation = {
  convId: string;
  items?: Message[];
  origin: string;
  originPageTitle: string;
  originPageUrl: string;
  preGeneratedReplyId?: string;
  lastMessage?: string;
  title?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  locale?: OutputLocale;
  linkId?: string; // 创建会话基于的 linkId
  contentId?: number;

  // 为阅读文章，阅读增强做的设计，后续添加
  readEnhanceIndexStatus?: any;
  readEnhanceArticle?: any;

  messages: ServerMessage[];
};

export const enum ConversationOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
