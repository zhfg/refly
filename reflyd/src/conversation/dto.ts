import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class CreateConversationParam {
  @ApiPropertyOptional()
  conversationId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  origin?: string; // 创建会话的 origin

  @ApiPropertyOptional()
  originPageUrl?: string; // 创建会话的 url

  @ApiPropertyOptional()
  originPageTitle?: string; // 所在 url 的 page title
}

export class CreateConversationResponse extends CreateConversationParam {
  conversationId: string;
  createdAt: number;
}

export class Conversation {}

export class ListConversationResponse {
  @ApiProperty({ type: [Conversation] })
  data: Conversation[];
}

export class ChatMessage {
  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: number;
}

export class ChatParam {
  @ApiProperty()
  query: string;

  @ApiPropertyOptional({ type: [ChatMessage] })
  chatHistory?: ChatMessage[];

  @ApiPropertyOptional()
  conversationId: string;
}
