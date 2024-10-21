import { ChatMessage, Conversation } from '@refly-packages/openapi-schema';
import { ChatMessage as ChatMessageModel, Conversation as ConversationModel } from '@prisma/client';
import { pick } from '@/utils';

export interface Mode {
  id: string;
  icon: any;
  text: string;
  prompt: string;
}

export function toChatMessageDTO(message: ChatMessageModel): ChatMessage {
  const dto: ChatMessage = {
    ...pick(message, ['msgId', 'type', 'content']),
    createdAt: message.createdAt.toJSON(),
    updatedAt: message.updatedAt.toJSON(),
  };
  if (message.type === 'human') {
    dto.invokeParam = JSON.parse(message.invokeParam || '{}');
  }
  if (message.type === 'ai') {
    dto.skillMeta = JSON.parse(message.skillMeta || '{}');
    dto.logs = JSON.parse(message.logs || '[]');
    dto.structuredData = JSON.parse(message.structuredData || '{}');
    dto.errors = JSON.parse(message.errors || '[]');
    dto.tokenUsage = JSON.parse(message.tokenUsage || '[]');
  }
  return dto;
}

export function conversationPO2DTO(
  conversation: ConversationModel & { messages?: ChatMessageModel[] },
): Conversation {
  const dto: Conversation = {
    ...pick(conversation, [
      'convId',
      'title',
      'lastMessage',
      'messageCount',
      'origin',
      'originPageTitle',
      'originPageUrl',
    ]),
    createdAt: conversation.createdAt.toJSON(),
    updatedAt: conversation.updatedAt.toJSON(),
  };
  if (conversation.messages) {
    dto.messages = conversation.messages.map(toChatMessageDTO);
  }
  return dto;
}
