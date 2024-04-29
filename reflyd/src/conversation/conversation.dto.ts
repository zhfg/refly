import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Conversation, MessageType } from '@prisma/client';

import { Content } from '../aigc/aigc.dto';
import { Source } from '../types/weblink';

export class ChatMessage {
  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: number;
}

export class CreateConversationParam {
  @ApiPropertyOptional({ description: '针对提问的内容' })
  contentId?: number;

  @ApiPropertyOptional()
  linkId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  origin?: string; // 创建会话的 origin

  @ApiPropertyOptional()
  originPageUrl?: string; // 创建会话的 url

  @ApiPropertyOptional()
  originPageTitle?: string; // 所在 url 的 page title

  @ApiPropertyOptional()
  locale?: string; // 语言设置
}

export class CreateConversationResponse extends CreateConversationParam {
  createdAt: number;
}

export class ConversationListItem {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  content?: Content;

  @ApiPropertyOptional({ type: [ChatMessage] })
  messages?: ChatMessage[];
}

export class ListConversationResponse {
  @ApiProperty({ type: [ConversationListItem] })
  data: ConversationListItem[];
}

export class ChatParam {
  @ApiProperty()
  query: string;

  @ApiPropertyOptional({ type: [ChatMessage] })
  chatHistory?: ChatMessage[];

  @ApiPropertyOptional()
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

export type QUICK_ACTION_TASK_PAYLOAD = {
  question?: string; // 用户问题

  actionType?: QUICK_ACTION_TYPE;
  actionPrompt?: string;
  reference?: string;
  conversationId?: string;
  filter?: {
    // 限制用于 quick-action 的网页列表
    weblinkList?: Source[];
  };
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
  filter?: {
    // 限制召回网页的 filter，都换成这种富内容的形态
    weblinkList?: Source[];
  };
};

export type Task = {
  taskType: TASK_TYPE;
  taskId?: string; // task:xxxx-xxxx-xxxx-xxxx
  convId?: string; // 对话 id，为空代表创建新对话
  contentId?: string; // 内容 id
  createConvParam?: CreateConversationParam; // 创建新对话的参数
  language?: LANGUAGE;
  locale?: LOCALE;
  data?: CHAT | QUICK_ACTION_TASK_PAYLOAD;

  conversation?: Conversation; // 对话数据（服务端内部使用）
};

export type TaskResponse = {
  sources: Source[];
  answer: string;
  relatedQuestions?: string[];
};
