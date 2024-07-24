import { ChatMessage, Conversation, MessageType } from '@refly/openapi-schema';
import { ChatMessage as ChatMessageModel, Conversation as ConversationModel } from '@prisma/client';
import { pick } from '@/utils';

export interface CreateChatMessageInput {
  type: MessageType;
  sources?: string;
  content: string;
  convId: string;
  skillMeta?: string;
  uid: string;
  logs?: string;
  structuredData?: string;
  locale?: string;
  relatedQuestions?: string;
  selectedWeblinkConfig?: string;
}

export interface Mode {
  id: string;
  icon: any;
  text: string;
  prompt: string;
}

export function toChatMessageDTO(message: ChatMessageModel): ChatMessage {
  const dto: ChatMessage = {
    ...pick(message, ['msgId', 'type', 'content', 'selectedWeblinkConfig']),
    createdAt: message.createdAt.toJSON(),
    updatedAt: message.updatedAt.toJSON(),
  };
  if (message.type === 'ai') {
    dto.skillMeta = JSON.parse(message.skillMeta || '{}');
    dto.logs = JSON.parse(message.logs || '[]');
    dto.structuredData = JSON.parse(message.structuredData || '{}');
  }
  return dto;
}

export function toConversationDTO(
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
