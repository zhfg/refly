import { IContext, SelectedContentDomain, SkillContextContentItemMetadata } from '../types';
import {
  SkillContextContentItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
  Source,
  ResourceType,
} from '@refly-packages/openapi-schema';
import { truncateContext, truncateMessages } from './truncator';
import { BaseMessage } from '@langchain/core/messages';
import { getClientOrigin } from '@refly-packages/utils';

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

export const concatMergedContextToStr = (mergedContext: {
  mentionedContext: IContext;
  lowerPriorityContext: IContext;
  webSearchSources: Source[];
}) => {
  const { mentionedContext, lowerPriorityContext, webSearchSources } = mergedContext || {};
  let contextStr = '';

  const webSearchContextStr = concatContextToStr({ webSearchSources });
  const mentionedContextStr = concatContextToStr(mentionedContext);
  const lowerPriorityContextStr = concatContextToStr(lowerPriorityContext);

  if (webSearchContextStr?.length > 0) {
    contextStr += `\n\n<WebSearchContext>${webSearchContextStr}</WebSearchContext>\n\n`;
  }

  if (mentionedContextStr?.length > 0) {
    contextStr += `\n\n<MentionedContext>${mentionedContextStr}</MentionedContext>\n\n`;
  }

  if (lowerPriorityContextStr?.length > 0) {
    contextStr += `\n\n<OtherContext>${lowerPriorityContextStr}</OtherContext>\n\n`;
  }

  if (contextStr?.length > 0) {
    contextStr = `<Context>${contextStr}</Context>`;
  }

  return contextStr;
};

export const flattenMergedContextToSources = (mergedContext: {
  mentionedContext: IContext;
  lowerPriorityContext: IContext;
  webSearchSources: Source[];
}) => {
  const { mentionedContext, lowerPriorityContext, webSearchSources } = mergedContext || {};

  const sources = [
    ...flattenContextToSources({
      webSearchSources,
    }),
    ...flattenContextToSources(mentionedContext),
    ...flattenContextToSources(lowerPriorityContext),
  ];

  // Remove duplicates
  const uniqueSources = sources.filter(
    (source, index, self) =>
      index ===
      self.findIndex((s) => s.url === source.url && s.title === source.title && s.pageContent === source.pageContent),
  );

  return uniqueSources;
};

// TODO: should replace id with `type-index` for better llm extraction
// citationIndex for each context item is used for LLM to cite the context item in the final answer
export const concatContextToStr = (context: Partial<IContext>) => {
  const { contentList = [], resources = [], notes = [], webSearchSources = [] } = context || {};

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

  // TODO: prior handle mentioned context, includes mentioned contentList、notes、resources
  // TODO: otherwise, the context more front will be more priority, should be most focused in the prompt

  if (contentList.length > 0) {
    // contextStr += 'Following are the user selected content: \n';
    const concatContent = (content: string, from: SelectedContentDomain, title: string, id?: string, url?: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='selectedContent' from='${from}' ${
        id ? `entityId='${id}'` : ''
      } title='${title}' ${url ? `weblinkUrl='${url}'` : ''}>${content}</ContextItem>`;
    };

    const contentStr = contentList
      .map((c) => {
        const { metadata } = c;
        const { domain, entityId, title, url } = metadata as any as SkillContextContentItemMetadata;
        return concatContent(c?.content, domain as SelectedContentDomain, title, entityId, url);
      })
      .join('\n\n');

    contextStr += `\n\n<UserSelectedContent>${contentStr}</UserSelectedContent>\n\n`;
  }

  if (notes.length > 0) {
    // contextStr += 'Following are the knowledge base notes: \n';
    const concatNote = (id: string, title: string, content: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='note' entityId='${id}' title='${title}'>${content}</ContextItem>`;
    };

    const noteStr = notes.map((n) => concatNote(n.note?.noteId!, n.note?.title!, n.note?.content!)).join('\n\n');

    contextStr += `\n\n<KnowledgeBaseNotes>${noteStr}</KnowledgeBaseNotes>\n\n`;
  }

  if (resources.length > 0) {
    // contextStr += 'Following are the knowledge base resources: \n';
    const concatResource = (id: string, type: ResourceType, title: string, content: string) => {
      return `<ContextItem citationIndex='[[citation:${index++}]]' type='resource' entityId='${id}' title='${title}'>${content}</ContextItem>`;
    };

    const resourceStr = resources
      .map((r) =>
        concatResource(r.resource?.resourceId!, r.resource?.resourceType!, r.resource?.title!, r.resource?.content!),
      )
      .join('\n');

    contextStr += `\n\n<KnowledgeBaseResources>${resourceStr}</KnowledgeBaseResources>\n\n`;
  }

  return contextStr;
};

export const summarizeContext = (context: IContext, maxContextTokens: number): string => {
  const { contentList = [], resources = [], notes = [], collections, messages } = context || {};
  const previewedContext: IContext = {
    resources: resources.map((r) => ({
      ...r,
      content: r?.resource?.contentPreview || r.resource?.content?.slice(0, 50) + '...',
    })),
    notes: notes.map((n) => ({ ...n, content: n?.note?.contentPreview || n.note?.content?.slice(0, 50) + '...' })),
    contentList: contentList.map((c) => ({ ...c, content: c.content?.slice(0, 50) + '...' })),
  };
  const truncatedContext = truncateContext(previewedContext, maxContextTokens);

  // contentPreview just about 100~150 tokens, cannot overflow
  const contextStr = concatContextToStr(truncatedContext);

  return contextStr || 'no available context';
};

export const summarizeChatHistory = (messages: BaseMessage[]): string => {
  const chatHistoryStr = concatChatHistoryToStr(truncateMessages(messages));
  return chatHistoryStr || 'no available chat history';
};

export function flattenContextToSources(context: Partial<IContext>): Source[] {
  const { webSearchSources = [], contentList = [], resources = [], notes = [] } = context || {};
  const sources: Source[] = [];

  // Web search sources
  webSearchSources.forEach((source, index) => {
    sources.push({
      url: source.url,
      title: source.title,
      pageContent: source.pageContent,
      metadata: {
        source: source.url,
        title: source.title,
      },
    });
  });

  const baseUrl = getClientOrigin();

  // User selected content
  contentList.forEach((content: SkillContextContentItem, index) => {
    const metadata = content.metadata as unknown as SkillContextContentItemMetadata;
    sources.push({
      url: metadata?.url,
      title: metadata?.title,
      pageContent: content.content,
      metadata: {
        source: metadata?.url,
        title: metadata?.title,
        entityId: metadata?.entityId,
        entityType: metadata?.domain,
      },
    });
  });

  // Knowledge base notes
  notes.forEach((note: SkillContextNoteItem, index) => {
    sources.push({
      url: `${baseUrl}/knowledge-base?noteId=${note.note?.noteId}`,
      title: note.note?.title,
      pageContent: note.note?.content || '',
      metadata: {
        title: note.note?.title,
        entityId: note.note?.noteId,
        entityType: 'note',
        source: `${baseUrl}/knowledge-base?noteId=${note.note?.noteId}`,
      },
    });
  });

  // Knowledge base resources
  resources.forEach((resource: SkillContextResourceItem, index) => {
    sources.push({
      url: `${baseUrl}/knowledge-base?resId=${resource.resource?.resourceId}`,
      title: resource.resource?.title,
      pageContent: resource.resource?.content || '',
      metadata: {
        title: resource.resource?.title,
        entityId: resource.resource?.resourceId,
        entityType: 'resource',
        source: `${baseUrl}/knowledge-base?resId=${resource.resource?.resourceId}`,
      },
    });
  });

  return sources;
}
