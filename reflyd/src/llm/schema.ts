import { MessageSource } from '@prisma/client';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

export type LCChatMessage = AIMessage | HumanMessage | SystemMessage;

export function createLCChatMessage(
  content: string,
  source: MessageSource,
): LCChatMessage {
  switch (source) {
    case 'ai':
      return new AIMessage({ content });
    case 'human':
      return new HumanMessage({ content });
    case 'system':
      return new SystemMessage({ content });
    default:
      throw new Error(`invalid message source: ${source}`);
  }
}
