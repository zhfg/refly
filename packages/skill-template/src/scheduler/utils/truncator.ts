import {
  ChatMessage,
  SkillContextContentItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
} from '@refly-packages/openapi-schema';

import { IContext } from '../types';
import { countToken } from './token';

const MAX_MESSAGES = 5;
const MAX_MESSAGE_TOKENS = 100;
const MAX_MESSAGES_TOTAL_TOKENS = 1000;

export const truncateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  let totalTokens = 0;
  const truncatedMessages: ChatMessage[] = [];

  for (let i = messages.length - 1; i >= Math.max(0, messages.length - MAX_MESSAGES); i--) {
    const message = messages[i];
    let content = message.content as string;
    let tokens = countToken(content);

    if (tokens > MAX_MESSAGE_TOKENS) {
      content = truncateText(content, MAX_MESSAGE_TOKENS);
      tokens = MAX_MESSAGE_TOKENS;
    }

    if (totalTokens + tokens > MAX_MESSAGES_TOTAL_TOKENS) {
      break;
    }

    const newMessage = { ...message, content };
    truncatedMessages.unshift(newMessage);
    totalTokens += tokens;
  }

  return truncatedMessages;
};

export const truncateText = (text: string, maxTokens: number): string => {
  const words = text.split(' ');
  let truncatedText = '';
  let currentTokens = 0;

  for (const word of words) {
    const wordTokens = countToken(word);
    if (currentTokens + wordTokens <= maxTokens) {
      truncatedText += (truncatedText ? ' ' : '') + word;
      currentTokens += wordTokens;
    } else {
      break;
    }
  }

  return truncatedText + (truncatedText.length < text.length ? '...' : '');
};

export const truncateContext = (context: IContext, maxTokens: number): IContext => {
  let remainingTokens = maxTokens;
  const truncatedContext: IContext = { ...context };

  // Helper function to truncate a list of items, truncate priority is resource > note > contentList
  const truncateItems = <T extends SkillContextContentItem | SkillContextResourceItem | SkillContextNoteItem>(
    items: T[],
    getContent: (item: T) => string,
    setContent: (item: T, content: string) => T,
  ): T[] => {
    const truncatedItems: T[] = [];
    for (const item of items) {
      const content = getContent(item);
      const tokens = countToken(content);
      if (tokens <= remainingTokens) {
        truncatedItems.push(item);
        remainingTokens -= tokens;
      } else if (remainingTokens > 0) {
        const truncatedContent = truncateText(content, remainingTokens);
        truncatedItems.push(setContent(item, truncatedContent));
        remainingTokens = 0;
      } else {
        break;
      }
    }
    return truncatedItems;
  };

  // Truncate resources
  truncatedContext.resources = truncateItems<SkillContextResourceItem>(
    context.resources,
    (item) => item.resource?.content || '',
    (item, content) => ({ ...item, resource: { ...item.resource!, content } }),
  );

  // Truncate notes
  truncatedContext.notes = truncateItems<SkillContextNoteItem>(
    context.notes,
    (item) => item.note?.content || '',
    (item, content) => ({ ...item, note: { ...item.note!, content } }),
  );

  // Truncate contentList
  truncatedContext.contentList = truncateItems<SkillContextContentItem>(
    context.contentList,
    (item) => item.content || '',
    (item, content) => ({ ...item, content }),
  );

  return truncatedContext;
};
