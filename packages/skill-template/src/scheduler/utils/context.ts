import { GraphState, IContext, SkillContextContentItemMetadata } from '../types';
import {
  countContentTokens,
  countMentionedContextTokens,
  countNoteTokens,
  countResourceTokens,
  countToken,
} from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processNotesWithSimilarity,
  processResourcesWithSimilarity,
  processMentionedContextWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { truncateContext, truncateText } from './truncator';
import { concatContextToStr } from './summarizer';
import { SkillContextContentItem, SkillContextNoteItem, SkillContextResourceItem, Source } from '@refly/openapi-schema';
import { uniqBy } from 'lodash';

// configurable params
const MAX_CONTEXT_RATIO = 0.7;
const MAX_SELECTED_CONTENT_RATIO = 2 / 4;
const MAX_NOTES_RATIO = 1 / 4;
const MAX_RESOURCES_RATIO = 1 / 4;

export async function prepareContext(
  {
    query,
    mentionedContext,
  }: {
    query: string;
    mentionedContext: IContext;
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
  const modelWindowSize = ModelContextLimitMap[modelName];
  const maxContextTokens = Math.floor(modelWindowSize * MAX_CONTEXT_RATIO);
  // TODO: think remainingTokens may out of range
  let remainingTokens = maxContextTokens;

  const { processedWebSearchContext } = await prepareWebSearchContext(
    {
      query,
    },
    ctx,
  );
  const webSearchContextTokens = 0;
  remainingTokens = maxContextTokens - webSearchContextTokens;

  // 2. mentioned context
  const { mentionedContextTokens, processedMentionedContext } = await prepareMentionedContext(
    {
      query,
      mentionedContext,
      maxMentionedContextTokens: remainingTokens,
    },
    ctx,
  );
  remainingTokens -= mentionedContextTokens;

  // 3. relevant context
  const { processedRelevantContext } = await prepareRelevantContext(
    {
      query,
      maxRelevantContextTokens: remainingTokens,
    },
    ctx,
  );

  let mergedContext = mergeAndDeduplicateContexts(processedMentionedContext, processedRelevantContext);
  mergedContext = {
    ...mergedContext,
    webSearchSources: processedWebSearchContext.webSearchSources,
  };
  const contextStr = concatContextToStr(mergedContext);
  const sources = flattenContextToSources(mergedContext);

  ctx.ctxThis.emitEvent(
    {
      event: 'structured_data',
      content: JSON.stringify(sources),
      structuredDataKey: 'sources',
    },
    ctx.configSnapshot,
  );

  return contextStr;
}

export async function prepareWebSearchContext(
  {
    query,
  }: {
    query: string;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  processedWebSearchContext: IContext;
}> {
  const processedWebSearchContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    webSearchSources: [],
  };
  const res = await ctx.ctxThis.engine.service.webSearch(ctx.configSnapshot.user, {
    query,
    limit: 10,
  });
  const webSearchSources = res.data.map((item) => ({
    url: item.url,
    title: item.name,
    pageContent: item.snippet,
  }));
  processedWebSearchContext.webSearchSources = webSearchSources;

  return {
    processedWebSearchContext,
  };
}

export async function prepareMentionedContext(
  {
    query,
    mentionedContext,
    maxMentionedContextTokens,
  }: {
    query: string;
    mentionedContext: IContext;
    maxMentionedContextTokens: number;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  mentionedContextTokens: number;
  processedMentionedContext: IContext;
}> {
  let processedMentionedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  const allMentionedContextTokens = countMentionedContextTokens(mentionedContext);

  let mentionedContextTokens = allMentionedContextTokens;
  if (allMentionedContextTokens > maxMentionedContextTokens) {
    processedMentionedContext = await processMentionedContextWithSimilarity(
      query,
      mentionedContext,
      maxMentionedContextTokens,
      ctx,
    );
    mentionedContextTokens = countMentionedContextTokens(processedMentionedContext);

    if (mentionedContextTokens > maxMentionedContextTokens) {
      processedMentionedContext = truncateContext(processedMentionedContext, maxMentionedContextTokens);
      mentionedContextTokens = countMentionedContextTokens(processedMentionedContext);
    }
  }

  return {
    mentionedContextTokens,
    processedMentionedContext,
  };
}

export async function prepareRelevantContext(
  {
    query,
    maxRelevantContextTokens,
  }: {
    query: string;
    maxRelevantContextTokens: number;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  relevantContextTokens: number;
  processedRelevantContext: IContext;
}> {
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
  let remainingTokens = maxRelevantContextTokens;

  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    notes: [],
  };

  // all tokens
  const allSelectedContentTokens = countContentTokens(contentList);
  const allNotesTokens = countNoteTokens(notes);
  const allResourcesTokens = countResourceTokens(resources);

  // 3. selected content context
  let selectedContentTokens = allSelectedContentTokens;
  const selectedContentMaxTokens =
    remainingTokens - allNotesTokens - allResourcesTokens > MAX_SELECTED_CONTENT_RATIO * remainingTokens
      ? remainingTokens - allNotesTokens - allResourcesTokens
      : MAX_SELECTED_CONTENT_RATIO * remainingTokens;
  if (selectedContentTokens > selectedContentMaxTokens) {
    const relevantContentList = await processSelectedContentWithSimilarity(
      query,
      contentList,
      selectedContentMaxTokens,
      ctx,
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
    remainingTokens - selectedContentTokens - allResourcesTokens > MAX_NOTES_RATIO * remainingTokens
      ? remainingTokens - selectedContentTokens - allResourcesTokens
      : MAX_NOTES_RATIO * remainingTokens;
  if (notesTokens > notesMaxTokens) {
    const relevantNotes = await processNotesWithSimilarity(query, notes, notesMaxTokens, ctx);
    relevantContexts.notes.concat(...relevantNotes);
    notesTokens = relevantNotes.reduce((sum, note) => sum + countToken(note?.note?.content || ''), 0);
  } else {
    relevantContexts.notes.concat(...notes);
  }

  // 5. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  let resourcesTokens = allResourcesTokens;
  const resourcesMaxTokens =
    remainingTokens - selectedContentTokens - notesTokens > MAX_RESOURCES_RATIO * remainingTokens
      ? remainingTokens - selectedContentTokens - notesTokens
      : MAX_RESOURCES_RATIO * remainingTokens;
  if (resourcesTokens > resourcesMaxTokens) {
    const relevantResources = await processResourcesWithSimilarity(query, resources, resourcesMaxTokens, ctx);
    relevantContexts.resources.concat(...relevantResources);
    resourcesTokens = relevantResources.reduce(
      (sum, resource) => sum + countToken(resource?.resource?.content || ''),
      0,
    );
  } else {
    relevantContexts.resources.concat(...resources);
  }

  // 6. TODO: collections context, mainly for knowledge base search meat filter

  let totalTokens = selectedContentTokens + notesTokens + resourcesTokens;
  if (totalTokens > remainingTokens) {
    relevantContexts = truncateContext(relevantContexts, remainingTokens);
    totalTokens =
      countContentTokens(relevantContexts.contentList) +
      countNoteTokens(relevantContexts.notes) +
      countResourceTokens(relevantContexts.resources);
  }

  return {
    processedRelevantContext: relevantContexts,
    relevantContextTokens: totalTokens,
  };
}

export function mergeAndDeduplicateContexts(context1: IContext, context2: IContext): IContext {
  return {
    contentList: uniqBy([...context1.contentList, ...context2.contentList], 'content'),
    resources: uniqBy([...context1.resources, ...context2.resources], (item) => item.resource?.content),
    notes: uniqBy([...context1.notes, ...context2.notes], (item) => item.note?.content),
    webSearchSources: uniqBy(
      [...(context1.webSearchSources || []), ...(context2.webSearchSources || [])],
      (item) => item?.pageContent,
    ),
  };
}

export function flattenContextToSources(context: IContext): Source[] {
  const { webSearchSources = [], contentList = [], resources = [], notes = [] } = context;
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
      title: note.note?.title,
      pageContent: note.note?.content || '',
      metadata: {
        title: note.note?.title,
        entityId: note.note?.noteId,
        entityType: 'note',
      },
    });
  });

  // Knowledge base resources
  resources.forEach((resource: SkillContextResourceItem, index) => {
    sources.push({
      title: resource.resource?.title,
      pageContent: resource.resource?.content || '',
      metadata: {
        title: resource.resource?.title,
        entityId: resource.resource?.resourceId,
        entityType: 'resource',
      },
    });
  });

  return sources;
}
