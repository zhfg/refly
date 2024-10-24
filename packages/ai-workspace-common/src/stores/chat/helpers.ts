import type { ChatMessage } from '@refly/openapi-schema';

export const getMessageById = (messages: ChatMessage[], id: string) => messages.find((m) => m.msgId === id);

export const chatHelpers = {
  getMessageById,
};
