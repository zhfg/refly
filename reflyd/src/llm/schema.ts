import { MessageType } from '@prisma/client';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

export type LCChatMessage = AIMessage | HumanMessage | SystemMessage;

export function createLCChatMessage(
  content: string,
  type: MessageType,
): LCChatMessage {
  switch (type) {
    case 'ai':
      return new AIMessage({ content });
    case 'human':
      return new HumanMessage({ content });
    case 'system':
      return new SystemMessage({ content });
    default:
      throw new Error(`invalid message source: ${type}`);
  }
}
