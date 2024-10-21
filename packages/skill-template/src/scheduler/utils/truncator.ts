import {
  SkillContextContentItem,
  SkillContextCanvasItem,
  SkillContextResourceItem,
} from '@refly-packages/openapi-schema';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { sortContentBySimilarity } from './semanticSearch';

import { IContext, GraphState } from '../types';
import { countToken } from './token';
import { BaseMessage } from '@langchain/core/messages';

// configurable params
const MAX_MESSAGES = 5;
const MAX_MESSAGE_TOKENS = 400;
const MAX_MESSAGES_TOTAL_TOKENS = 2000;

export const truncateMessages = (
  messages: BaseMessage[] = [],
  maxMessages = MAX_MESSAGES,
  maxMessageTokens = MAX_MESSAGE_TOKENS,
  maxMessagesTotalTokens = MAX_MESSAGES_TOTAL_TOKENS,
): BaseMessage[] => {
  let totalTokens = 0;
  const truncatedMessages: BaseMessage[] = [];

  for (let i = messages.length - 1; i >= Math.max(0, messages.length - maxMessages); i--) {
    const message = messages[i];
    let content = message.content as string;
    let tokens = countToken(content);

    if (tokens > maxMessageTokens) {
      content = truncateText(content, maxMessageTokens);
      tokens = maxMessageTokens;
    }

    if (totalTokens + tokens > maxMessagesTotalTokens) {
      break;
    }

    message.content = content; // replace content other than new message
    truncatedMessages.unshift(message);
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

  // Helper function to truncate a list of items, truncate priority is resource > canvas > contentList
  const truncateItems = <T extends SkillContextContentItem | SkillContextResourceItem | SkillContextCanvasItem>(
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

  // Truncate canvases
  truncatedContext.canvases = truncateItems<SkillContextCanvasItem>(
    context.canvases,
    (item) => item.canvas?.content || '',
    (item, content) => ({ ...item, canvas: { ...item.canvas!, content } }),
  );

  // Truncate contentList
  truncatedContext.contentList = truncateItems<SkillContextContentItem>(
    context.contentList,
    (item) => item.content || '',
    (item, content) => ({ ...item, content }),
  );

  return truncatedContext;
};

export async function mergeAndTruncateContexts(
  relevantContext: IContext,
  containerLevelContext: IContext,
  query: string,
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<IContext> {
  // 1. Handle contentList (highest priority)
  const allContentList = [...relevantContext.contentList, ...containerLevelContext.contentList];
  const uniqueContentList = Array.from(new Set(allContentList.map((item) => JSON.stringify(item)))).map((item) =>
    JSON.parse(item),
  );

  let sortedContentList: SkillContextContentItem[] = [];
  if (uniqueContentList.length > 1) {
    sortedContentList = await sortContentBySimilarity(query, uniqueContentList, ctx);
  } else {
    sortedContentList = uniqueContentList;
  }

  // 2. Merge resources and canvases into one array
  const combinedItems: (SkillContextResourceItem | SkillContextCanvasItem)[] = [
    ...relevantContext.resources,
    ...relevantContext.canvases,
    ...containerLevelContext.resources,
    ...containerLevelContext.canvases,
  ];

  // 3. Deduplicate (by id and content combination)
  const uniqueCombinedItems = Array.from(
    new Set(
      combinedItems.map((item) => {
        const id =
          (item as SkillContextResourceItem).resource?.resourceId || (item as SkillContextCanvasItem).canvas?.canvasId;
        const content =
          (item as SkillContextResourceItem).resource?.content || (item as SkillContextCanvasItem).canvas?.content;
        return `${id}:${content}`;
      }),
    ),
  ).map(
    (key) =>
      combinedItems.find((item) => {
        const id =
          (item as SkillContextResourceItem).resource?.resourceId || (item as SkillContextCanvasItem).canvas?.canvasId;
        const content =
          (item as SkillContextResourceItem).resource?.content || (item as SkillContextCanvasItem).canvas?.content;
        return `${id}:${content}` === key;
      })!,
  );

  // 4. Sort by similarity
  const itemsForSorting = uniqueCombinedItems.map((item) => ({
    content: (item as SkillContextResourceItem).resource?.content || (item as SkillContextCanvasItem).canvas?.content,
    metadata: {
      type: 'resource' in item ? 'resource' : 'canvas',
      id: (item as SkillContextResourceItem).resource?.resourceId || (item as SkillContextCanvasItem).canvas?.canvasId,
    },
  }));

  let sortedItems: (SkillContextResourceItem | SkillContextCanvasItem)[] = [];
  if (itemsForSorting.length > 1) {
    sortedItems = await sortContentBySimilarity(query, itemsForSorting, ctx);
  } else {
    sortedItems = itemsForSorting;
  }

  // Restore the actual items after sorting
  const sortedCombinedItems = sortedItems.map(
    (sortedItem) =>
      uniqueCombinedItems.find(
        (item) =>
          ('resource' in item ? 'resource' : 'canvas') === sortedItem.metadata.type &&
          ((item as SkillContextResourceItem).resource?.resourceId ||
            (item as SkillContextCanvasItem).canvas?.canvasId) === sortedItem.metadata.id,
      )!,
  );

  // 5. Truncate
  const truncatedContext = truncateContextWithPriority(sortedContentList, sortedCombinedItems, maxTokens);

  return truncatedContext;
}

function truncateContextWithPriority(
  contentList: SkillContextContentItem[],
  combinedItems: any[],
  maxTokens: number,
): IContext {
  let remainingTokens = maxTokens;
  const truncatedContext: IContext = {
    contentList: [],
    resources: [],
    canvases: [],
  };

  // First, add contentList items
  for (const item of contentList) {
    const tokens = countToken(item.content);
    if (remainingTokens >= tokens) {
      truncatedContext.contentList.push(item);
      remainingTokens -= tokens;
    } else {
      break;
    }
  }

  // Then, add combined items (resources and canvases)
  for (const item of combinedItems) {
    const content = 'resource' in item ? item.resource?.content : item.canvas?.content;
    const tokens = countToken(content);
    if (remainingTokens >= tokens) {
      if ('resource' in item) {
        truncatedContext.resources.push(item);
      } else {
        truncatedContext.canvases.push(item);
      }
      remainingTokens -= tokens;
    } else {
      break;
    }
  }

  return truncatedContext;
}
