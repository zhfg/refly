import type { ServerMessage } from './message';
import { OutputLocale } from '../i18n';

export interface Thread {
  convId: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  origin: string;
  originPageUrl: string;
  originPageTitle: string;
  createdAt: string;
  updatedAt: string;
  messages: ServerMessage[];

  // 基于 feed 或 digest 创建的表示
  contentId?: string;
  locale: OutputLocale;
}
