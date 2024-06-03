import { MessageType } from '@refly/openapi-schema';

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
