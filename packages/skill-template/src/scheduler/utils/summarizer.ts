import { IContext, SelectedContentDomain, SkillContextContentItemMetadata } from '../types';
import { ResourceType } from '@refly-packages/openapi-schema';
import { truncateMessages } from './truncator';
import { BaseMessage } from '@langchain/core/messages';

export const concatChatHistoryToStr = (messages: BaseMessage[]) => {
  let chatHistoryStr = '';

  if (messages.length > 0) {
    const concatMessage = (content: string, type: string) => {
      return `<ChatHistoryItem type={${type}}>${content}</ChatHistoryItem>`;
    };

    chatHistoryStr += messages.map((m) => {
      const type = m?.additional_kwargs?.type as string;
      const content = m.content as string;
      return concatMessage(content, type);
    });
  }

  if (chatHistoryStr?.length > 0) {
    chatHistoryStr = `<ChatHistory>${chatHistoryStr}</ChatHistory>`;
  }

  return chatHistoryStr;
};

// TODO: should replace id with `type-index` for better llm extraction
// citationIndex for each context item is used for LLM to cite the context item in the final answer
export const concatContextToStr = (context: IContext) => {
  const { contentList = [], resources = [], notes = [], webSearchSources = [] } = context;

  let contextStr = '';
  let index = 1; // start from 1 to avoid 0 index issue in citation

  if (webSearchSources.length > 0) {
    // contextStr += 'Following are the web search results: \n';
    const concatWebSearchSource = (url: string, title: string, content: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='webSearchSource' url='${url}' title='${title}'>${content}</WebSearchSource>`;
    };

    contextStr += webSearchSources.map((s) => concatWebSearchSource(s.url, s.title, s.pageContent)).join('\n');
    contextStr += '\n\n';
  }

  if (contentList.length > 0) {
    // contextStr += 'Following are the user selected content: \n';
    const concatContent = (content: string, from: SelectedContentDomain, title: string, id?: string, url?: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='selectedContent' from='${from}' ${
        id ? `entityId='${id}'` : ''
      } title='${title}' ${url ? `weblinkUrl='${url}'` : ''}>${content}</UserSelectedContent>`;
    };

    contextStr += contentList.map((c) => {
      const { metadata } = c;
      const { domain, entityId, title, url } = metadata as any as SkillContextContentItemMetadata;
      return concatContent(c?.content, domain as SelectedContentDomain, title, entityId, url);
    });

    contextStr += '\n\n';
  }

  if (notes.length > 0) {
    // contextStr += 'Following are the knowledge base notes: \n';
    const concatNote = (id: string, title: string, content: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='note' entityId='${id}' title='${title}'>${content}</KnowledgeBaseNote>`;
    };

    contextStr += notes.map((n) => concatNote(n.note?.noteId!, n.note?.title!, n.note?.content!)).join('\n');
  }

  if (resources.length > 0) {
    // contextStr += 'Following are the knowledge base resources: \n';
    const concatResource = (id: string, type: ResourceType, title: string, content: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='resource' entityId='${id}' title='${title}'>${content}</KnowledgeBaseResource>`;
    };

    contextStr += resources
      .map((r) =>
        concatResource(r.resource?.resourceId!, r.resource?.resourceType!, r.resource?.title!, r.resource?.content!),
      )
      .join('\n');

    contextStr += '\n\n';
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

  return contextStr || 'no available context';
};

export const summarizeChatHistory = (messages: BaseMessage[]): string => {
  const chatHistoryStr = concatChatHistoryToStr(truncateMessages(messages));
  return chatHistoryStr || 'no available chat history';
};
