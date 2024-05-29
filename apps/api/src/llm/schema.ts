import { MessageType } from '@prisma/client';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { categoryList } from '../prompts/utils/category';

export type LLMChatMessage = AIMessage | HumanMessage | SystemMessage;

export function createLLMChatMessage(content: string, type: MessageType): LLMChatMessage {
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
