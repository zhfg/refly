import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  GraphState,
  IContext,
  MentionedContext,
  SelectedContentDomain,
  SkillContextContentItemMetadata,
} from '../types';
import {
  ChatMessage,
  Collection,
  MessageType,
  Note,
  Resource,
  ResourceType,
  SkillContextCollectionItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
} from '@refly-packages/openapi-schema';
import { z } from 'zod';

import { countToken } from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processNotesWithSimilarity,
  processResourcesWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '@/base';

const MAX_MESSAGES = 5;
const MAX_MESSAGE_TOKENS = 100;
const MAX_TOTAL_TOKENS = 1000;

export const concatChatHistoryToStr = (messages: ChatMessage[]) => {
  let chatHistoryStr = '';

  if (messages.length > 0) {
    chatHistoryStr += 'Following are the chat history: \n';

    const concatMessage = (content: string, type: MessageType) => {
      return `<ChatHistoryItem type={${type}}>${content}</ChatHistoryItem>`;
    };

    chatHistoryStr += messages.map((m) => {
      const { type, content } = m;
      return concatMessage(content, type);
    });
  }

  if (chatHistoryStr?.length > 0) {
    chatHistoryStr = `<ChatHistory>${chatHistoryStr}</ChatHistory>`;
  }

  return chatHistoryStr;
};

export const concatContextToStr = (relevantContext: IContext) => {
  const { contentList, resources, notes } = relevantContext;

  let contextStr = '';

  if (contentList.length > 0) {
    contextStr += 'Following are the user selected content: \n';
    const concatContent = (content: string, from: SelectedContentDomain, title: string, id?: string, url?: string) => {
      return `<UserSelectedContent from='${from}' ${id ? `entityId='${id}'` : ''} title='${title}' ${
        url ? `weblinkUrl='${url}'` : ''
      }>${content}</UserSelectedContent>`;
    };

    contextStr += contentList.map((c) => {
      const { metadata } = c;
      const { domain, entityId, title, url } = metadata as any as SkillContextContentItemMetadata;
      return concatContent(c?.content, domain as SelectedContentDomain, title, entityId, url);
    });

    contextStr += '\n\n';
  }

  if (resources.length > 0) {
    contextStr += 'Following are the knowledge base resources: \n';
    const concatResource = (id: string, type: ResourceType, title: string, content: string) => {
      return `<KnowledgeBaseItem type='${type}' entityId='${id}' title='${title}'>${content}</KnowledgeBaseResource>`;
    };

    contextStr += resources
      .map((r) =>
        concatResource(r.resource?.resourceId!, r.resource?.resourceType!, r.resource?.title!, r.resource?.content!),
      )
      .join('\n');

    contextStr += '\n\n';
  }

  if (notes.length > 0) {
    contextStr += 'Following are the knowledge base notes: \n';
    const concatNote = (id: string, title: string, content: string) => {
      return `<KnowledgeBaseItem type='note' entityId='${id}' title='${title}'>${content}</KnowledgeBaseNote>`;
    };

    contextStr += notes.map((n) => concatNote(n.note?.noteId!, n.note?.title!, n.note?.content!)).join('\n');
  }

  if (contextStr?.length > 0) {
    contextStr = `<Context>${contextStr}</Context>`;
  }

  return contextStr;
};

export const summarizeContext = (context: IContext): string => {
  const { contentList, resources, notes, collections, messages } = context;

  const contextStr = concatContextToStr({
    resources: resources.map((r) => ({ ...r, content: r.resource?.content?.slice(0, 50) + '...' })),
    notes: notes.map((n) => ({ ...n, content: n.note?.content?.slice(0, 50) + '...' })),
    contentList: contentList.map((c) => ({ ...c, content: c.content?.slice(0, 50) + '...' })),
    // collections: collections.map((c) => ({ ...c, content: c.collection?.content?.slice(0, 50) + '...' })),
  });

  return contextStr;
};

export const summarizeChatHistory = (messages: ChatMessage[]): string => {
  const chatHistoryStr = concatChatHistoryToStr(truncateMessages(messages));
  return chatHistoryStr;
};

const truncateMessages = (messages: ChatMessage[]): ChatMessage[] => {
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

    if (totalTokens + tokens > MAX_TOTAL_TOKENS) {
      break;
    }

    const newMessage = { ...message, content };
    truncatedMessages.unshift(newMessage);
    totalTokens += tokens;
  }

  return truncatedMessages;
};

const truncateText = (text: string, maxTokens: number): string => {
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

export async function prepareRelevantContext(
  {
    query,
    mentionedContext,
  }: {
    query: string;
    mentionedContext: MentionedContext[];
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<string> {
  const {
    locale = 'en',
    chatHistory = [],
    modelName,
    contentList,
    resources,
    notes,
    collections,
  } = ctx.configSnapshot.configurable;

  // configurable params
  const MAX_CONTEXT_RATIO = 0.7;
  const MAX_SELECTED_CONTENT_RATIO = 2 / 4;
  const MAX_NOTES_RATIO = 1 / 4;
  const MAX_RESOURCES_RATIO = 1 / 4;
  let remainingTokens = 0;

  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  // all tokens
  const modelWindowSize = ModelContextLimitMap[modelName];
  const maxContextTokens = Math.floor(modelWindowSize * MAX_CONTEXT_RATIO);
  const allSelectedContentTokens = contentList.reduce((sum, content) => sum + countToken(content?.content || ''), 0);
  const allNotesTokens = notes.reduce((sum, note) => sum + countToken(note?.note?.content), 0);
  const allResourcesTokens = resources.reduce((sum, resource) => sum + countToken(resource.resource?.content), 0);

  // TODO: 1. web search context
  const webSearchContextTokens = 0;
  remainingTokens = maxContextTokens - webSearchContextTokens;

  // TODO: 2. entity extract context: include rich text editor rules entity and LLM infer entity
  const entityExtractContextTokens = 0;
  remainingTokens = remainingTokens - entityExtractContextTokens;

  // 3. selected content context
  let selectedContentTokens = allSelectedContentTokens;
  const selectedContentMaxTokens =
    maxContextTokens - allNotesTokens - allResourcesTokens > MAX_SELECTED_CONTENT_RATIO * maxContextTokens
      ? maxContextTokens - allNotesTokens - allResourcesTokens
      : MAX_SELECTED_CONTENT_RATIO * maxContextTokens;
  if (selectedContentTokens > selectedContentMaxTokens) {
    const relevantContentList = await processSelectedContentWithSimilarity(
      query,
      contentList,
      selectedContentMaxTokens,
    );
    relevantContexts.contentList.concat(...relevantContentList);
    selectedContentTokens = relevantContentList.reduce((sum, content) => sum + countToken(content?.content || ''), 0);
  } else {
    relevantContexts.contentList.concat(...contentList);
  }

  // 4. notes context
  // remainingTokens = maxContextTokens - selectedContentTokens;
  let notesTokens = allNotesTokens;
  const notesMaxTokens =
    maxContextTokens - selectedContentTokens - allResourcesTokens > MAX_NOTES_RATIO * maxContextTokens
      ? maxContextTokens - selectedContentTokens - allResourcesTokens
      : MAX_NOTES_RATIO * maxContextTokens;
  if (notesTokens > notesMaxTokens) {
    const relevantNotes = await processNotesWithSimilarity(query, notes, notesMaxTokens);
    relevantContexts.notes.concat(...relevantNotes);
    notesTokens = relevantNotes.reduce((sum, note) => sum + countToken(note?.note?.content || ''), 0);
  } else {
    relevantContexts.notes.concat(...notes);
  }

  // 5. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  let resourcesTokens = allResourcesTokens;
  const resourcesMaxTokens =
    maxContextTokens - selectedContentTokens - notesTokens > MAX_RESOURCES_RATIO * maxContextTokens
      ? maxContextTokens - selectedContentTokens - notesTokens
      : MAX_RESOURCES_RATIO * maxContextTokens;
  if (resourcesTokens > resourcesMaxTokens) {
    const relevantResources = await processResourcesWithSimilarity(query, resources, resourcesMaxTokens);
    relevantContexts.resources.concat(...relevantResources);
    resourcesTokens = relevantResources.reduce(
      (sum, resource) => sum + countToken(resource?.resource?.content || ''),
      0,
    );
  } else {
    relevantContexts.resources.concat(...resources);
  }

  // 6. TODO: collections context, mainly for knowledge base search meat filter

  // 计算 relevantContexts 占用的 token，如果超过 maxContextTokens，则尾部依次裁剪
  let totalTokens = selectedContentTokens + notesTokens + resourcesTokens;

  if (totalTokens > maxContextTokens) {
    const excessTokens = totalTokens - maxContextTokens;
    let tokensToRemove = excessTokens;

    // 从资源开始裁剪
    while (tokensToRemove > 0 && relevantContexts.resources.length > 0) {
      const lastResource = relevantContexts.resources[relevantContexts.resources.length - 1];
      const lastResourceTokens = countToken(lastResource.resource?.content || '');
      if (lastResourceTokens <= tokensToRemove) {
        relevantContexts.resources.pop();
        tokensToRemove -= lastResourceTokens;
      } else {
        // 部分裁剪最后一个资源
        const truncatedContent = truncateText(
          lastResource.resource?.content || '',
          lastResourceTokens - tokensToRemove,
        );
        relevantContexts.resources[relevantContexts.resources.length - 1] = {
          ...lastResource,
          resource: { ...lastResource.resource!, content: truncatedContent },
        };
        tokensToRemove = 0;
      }
    }

    // 如果还需要裁剪，继续裁剪笔记
    while (tokensToRemove > 0 && relevantContexts.notes.length > 0) {
      const lastNote = relevantContexts.notes[relevantContexts.notes.length - 1];
      const lastNoteTokens = countToken(lastNote.note?.content || '');
      if (lastNoteTokens <= tokensToRemove) {
        relevantContexts.notes.pop();
        tokensToRemove -= lastNoteTokens;
      } else {
        // 部分裁剪最后一个笔记
        const truncatedContent = truncateText(lastNote.note?.content || '', lastNoteTokens - tokensToRemove);
        relevantContexts.notes[relevantContexts.notes.length - 1] = {
          ...lastNote,
          note: { ...lastNote.note!, content: truncatedContent },
        };
        tokensToRemove = 0;
      }
    }

    // 如果还需要裁剪，最后裁剪选定的内容
    while (tokensToRemove > 0 && relevantContexts.contentList.length > 0) {
      const lastContent = relevantContexts.contentList[relevantContexts.contentList.length - 1];
      const lastContentTokens = countToken(lastContent.content || '');
      if (lastContentTokens <= tokensToRemove) {
        relevantContexts.contentList.pop();
        tokensToRemove -= lastContentTokens;
      } else {
        // 部分裁剪最后一个内容
        const truncatedContent = truncateText(lastContent.content || '', lastContentTokens - tokensToRemove);
        relevantContexts.contentList[relevantContexts.contentList.length - 1] = {
          ...lastContent,
          content: truncatedContent,
        };
        tokensToRemove = 0;
      }
    }
  }

  const context = concatContextToStr(relevantContexts);
  return context;
}
