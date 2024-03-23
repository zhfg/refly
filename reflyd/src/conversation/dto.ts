import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Content } from 'src/aigc/dto';

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
  contentId?: string;

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
  createdAt: number;
}

export class Conversation {
  @ApiProperty()
  id: string;

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
  conversationId: string;
}
