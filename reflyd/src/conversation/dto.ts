import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Content } from 'src/aigc/aigc.dto';

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

export class Conversation {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  content?: Content;

  @ApiPropertyOptional({ type: [ChatMessage] })
  messages?: ChatMessage[];
}

export class ListConversationResponse {
  @ApiProperty({ type: [Conversation] })
  data: Conversation[];
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
