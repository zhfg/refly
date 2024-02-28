import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageSource } from '@prisma/client';

export class CreateConversationParam {
  @ApiPropertyOptional()
  title?: string;
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
  @ApiProperty({ enum: MessageSource })
  type: MessageSource;

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

export class RetrieveParam {
  @ApiProperty({ type: ChatParam })
  input: ChatParam;
}
