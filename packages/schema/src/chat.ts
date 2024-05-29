import { LOCALE } from '@refly/constants';
import { Content } from './content';

export type MessageType = 'ai' | 'human' | 'system';

export class ChatMessage {
  type: MessageType;
  content: string;
  createdAt: number;
}

export class CreateConversationParam {
  contentId?: number;
  linkId?: string; // 创建会话基于的 linkId
  title?: string;
  origin?: string; // 创建会话的 origin
  originPageUrl?: string; // 创建会话的 url
  originPageTitle?: string; // 所在 url 的 page title
  locale?: string; // 语言设置
}

export class CreateConversationResponse extends CreateConversationParam {
  createdAt: number;
}

export class ConversationListItem {
  id: number;
  content?: Content;
  messages?: ChatMessage[];
}

export class ListConversationResponse {
  data: ConversationListItem[];
}

export class SummaryParam {
  source: Source;
}

export class Selection {
  xPath: string;
  content: string;
  type: 'text' | 'table' | 'link' | 'image' | 'video' | 'audio';
}

export class PageMeta {
  source: string;
  title: string;
  publishedTime?: string;
  resourceId?: string;
  resourceName?: string;
  collectionId?: string;
  collectionName?: string;
}

export class Source {
  pageContent: string;
  metadata: PageMeta;
  score?: number;
  selections?: Selection[];
}

export class ChatParam {
  query: string;
  chatHistory?: ChatMessage[];
  conversationId: number;
}

export interface CreateChatMessageInput {
  type: MessageType;
  sources: string;
  content: string;
  userId: number;
  locale?: string;
  conversationId: number;
  relatedQuestions?: string;
  selectedWeblinkConfig?: string;
}

export interface Mode {
  id: string;
  icon: any;
  text: string;
  prompt: string;
}

export const enum TASK_STATUS {
  // 前端 task
  START = 'start',
  SHUTDOWN = 'shutdown',
}

export const enum TASK_TYPE {
  // 和服务端调通的 task
  CHAT = 'chat',
  GEN_TITLE = 'genTitle',
  QUICK_ACTION = 'quickAction',
  SEARCH_ENHANCE_KEYWORD = 'searchEnhanceKeyword',
  SEARCH_ENHANCE_SUMMARIZE = 'searchEnhanceSummarize',
  SEARCH_ENHANCE_ASK = 'searchEnhanceAsk',
}

export const enum LANGUAGE {
  AUTO = 'auto',
}

export const enum QUICK_ACTION_TYPE {
  SELECTION = 'selection',
  SUMMARY = 'summary', // 用作总结内容
}

export type GEN_TITLE = {
  conversationId: string;
};

export type RetrieveFilter = {
  // 限制召回的网页列表
  weblinkList?: Source[];
  // 限制召回的 url
  urls?: string[];
  // 限制召回的资源 id
  resourceIds?: string[];
  // 限制召回的集合 id
  collectionIds?: string[];
};

export type QUICK_ACTION_TASK_PAYLOAD = {
  question?: string; // 用户问题
  actionType?: QUICK_ACTION_TYPE;
  actionPrompt?: string;
  reference?: string;
  conversationId?: string;
  filter?: RetrieveFilter;
};

export type SEARCH_RESULT_ITEM = {
  title: string;
  url: string;
  desc: string;
};

export type SEARCH_ENHANCE = {
  keyword: string;
  items: SEARCH_RESULT_ITEM[];
  isManual: boolean;
};

export type CHAT = {
  question: string;
  filter?: RetrieveFilter;
};

export type Task = {
  taskType: TASK_TYPE;
  dryRun?: boolean; // 不关联任何对话
  taskId?: string; // task:xxxx-xxxx-xxxx-xxxx
  convId?: string; // 对话 id，为空代表创建新对话
  createConvParam?: CreateConversationParam; // 创建新对话的参数
  language?: LANGUAGE;
  locale?: LOCALE;
  data?: CHAT | QUICK_ACTION_TASK_PAYLOAD;
};

export type TaskResponse = {
  sources: Source[];
  answer: string;
  relatedQuestions?: string[];
};
