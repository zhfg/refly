import { IContext, SelectedContentDomain, SkillContextContentItemMetadata } from '../types';
import { ChatMessage, MessageType, ResourceType } from '@refly-packages/openapi-schema';
import { truncateMessages } from './truncator';

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
      return `<UserSelectedContent type='selectedContent' from='${from}' ${
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
