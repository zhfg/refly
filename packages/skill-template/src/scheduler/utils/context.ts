import { ChatMode, GraphState, IContext, SkillContextContentItemMetadata } from '../types';
import {
  countContentTokens,
  countContextTokens,
  countNoteTokens,
  countResourceTokens,
  countToken,
  countWebSearchContextTokens,
} from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processNotesWithSimilarity,
  processResourcesWithSimilarity,
  processCollectionsWithSimilarity,
  processWholeSpaceWithSimilarity,
  processMentionedContextWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { mergeAndTruncateContexts, truncateContext, truncateText } from './truncator';
import { flattenMergedContextToSources, concatMergedContextToStr } from './summarizer';
import {
  SkillContextContentItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
  SkillTemplateConfig,
  Source,
} from '@refly-packages/openapi-schema';
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
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
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
  const enableWebSearch = ctx.tplConfig?.enableWebSearch?.value;

  // TO TEST
  const modelWindowSize = ModelContextLimitMap[modelName];
  const maxContextTokens = Math.floor(modelWindowSize * MAX_CONTEXT_RATIO);
  // TODO: think remainingTokens may out of range
  let remainingTokens = maxContextTokens;

  // 1. web search context
  let processedWebSearchContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    webSearchSources: [],
  };
  if (enableWebSearch) {
    const preparedRes = await prepareWebSearchContext(
      {
        query,
      },
      ctx,
    );
    processedWebSearchContext = preparedRes.processedWebSearchContext;
  }
  const webSearchContextTokens = countWebSearchContextTokens(processedWebSearchContext.webSearchSources);
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

  // 3. lower priority context
  let lowerPriorityContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };
  if (remainingTokens > 0) {
    const { contentList = [], resources = [], notes = [] } = ctx.configSnapshot.configurable;

    const context = removeOverlappingContextItems(processedMentionedContext, { contentList, resources, notes });
    lowerPriorityContext = await prepareLowerPriorityContext(
      {
        query,
        maxLowerPriorityContextTokens: remainingTokens,
        context,
      },
      ctx,
    );
  }

  const deduplicatedLowerPriorityContext = deduplicateContexts(lowerPriorityContext);
  const mergedContext = {
    mentionedContext: processedMentionedContext,
    lowerPriorityContext: deduplicatedLowerPriorityContext,
    webSearchSources: processedWebSearchContext.webSearchSources,
  };
  const contextStr = concatMergedContextToStr(mergedContext);
  const sources = flattenMergedContextToSources(mergedContext);

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

// TODO: should be agentic search: 1. query split 2. atom query rewrite 3. multi-round search 4. reflection 5. end? -> iterative search
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
    ...mentionedContext,
  };

  const allMentionedContextTokens = countContextTokens(mentionedContext);

  if (allMentionedContextTokens === 0) {
    return {
      mentionedContextTokens: 0,
      processedMentionedContext: mentionedContext,
    };
  } else {
    // if mentioned context is not empty, we need to mutate the metadata of the mentioned context
    const { contentList = [], resources = [], notes = [] } = ctx.configSnapshot.configurable;
    const context: IContext = {
      contentList,
      resources,
      notes,
    };
    mutateContextMetadata(mentionedContext, context);
  }

  let mentionedContextTokens = allMentionedContextTokens;
  if (allMentionedContextTokens > maxMentionedContextTokens) {
    processedMentionedContext = await processMentionedContextWithSimilarity(
      query,
      mentionedContext,
      maxMentionedContextTokens,
      ctx,
    );
    mentionedContextTokens = countContextTokens(processedMentionedContext);

    if (mentionedContextTokens > maxMentionedContextTokens) {
      processedMentionedContext = truncateContext(processedMentionedContext, maxMentionedContextTokens);
      mentionedContextTokens = countContextTokens(processedMentionedContext);
    }
  }

  return {
    mentionedContextTokens,
    processedMentionedContext,
  };
}

export async function prepareLowerPriorityContext(
  {
    query,
    maxLowerPriorityContextTokens,
    context,
  }: {
    query: string;
    maxLowerPriorityContextTokens: number;
    context: IContext;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<IContext> {
  // 1. relevant context
  const relevantContext = await prepareRelevantContext(
    {
      query,
      context,
    },
    ctx,
  );

  // 2. container level context
  const containerLevelContext = await prepareContainerLevelContext(
    {
      query,
      context,
    },
    ctx,
  );

  const finalContext = await mergeAndTruncateContexts(
    relevantContext,
    containerLevelContext,
    query,
    maxLowerPriorityContextTokens,
    ctx,
  );

  return finalContext;
}

export async function prepareRelevantContext(
  {
    query,
    context,
  }: {
    query: string;
    context: IContext;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<IContext> {
  const { contentList = [], resources = [], notes = [] } = context;
  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    notes: [],
  };

  // 1. selected content context
  relevantContexts.contentList =
    contentList.length > 0 ? await processSelectedContentWithSimilarity(query, contentList, Infinity, ctx) : [];

  // 2. notes context
  relevantContexts.notes = notes.length > 0 ? await processNotesWithSimilarity(query, notes, Infinity, ctx) : [];

  // 3. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  relevantContexts.resources =
    resources.length > 0 ? await processResourcesWithSimilarity(query, resources, Infinity, ctx) : [];

  return relevantContexts;
}

export async function prepareContainerLevelContext(
  {
    query,
    context,
  }: {
    query: string;
    context: IContext;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<IContext> {
  const chatMode = ctx.tplConfig?.chatMode?.value as ChatMode;
  const enableSearchWholeSpace = chatMode === ChatMode.WHOLE_SPACE_SEARCH;

  const processedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  const { collections } = context;

  // 1. collections context, mainly for knowledge base search meat filter
  const relevantResourcesOrNotesFromCollections = await processCollectionsWithSimilarity(query, collections, ctx);

  // 2. whole space search context
  const relevantResourcesOrNotesFromWholeSpace = enableSearchWholeSpace
    ? await processWholeSpaceWithSimilarity(query, ctx)
    : [];

  // 3. 按照 resource 和 note 进行分组，去重，并放置在 processedContext
  const uniqueResourceIds = new Set<string>();
  const uniqueNoteIds = new Set<string>();

  const addUniqueItem = (item: SkillContextResourceItem | SkillContextNoteItem) => {
    if ('resource' in item && item.resource) {
      const resourceId = item.resource.resourceId;
      if (!uniqueResourceIds.has(resourceId)) {
        uniqueResourceIds.add(resourceId);
        processedContext.resources.push(item);
      }
    } else if ('note' in item && item.note) {
      const noteId = item.note.noteId;
      if (!uniqueNoteIds.has(noteId)) {
        uniqueNoteIds.add(noteId);
        processedContext.notes.push(item);
      }
    }
  };

  // 优先添加来自 collections 的项目
  relevantResourcesOrNotesFromCollections.forEach(addUniqueItem);

  // 然后添加来自 whole space 的项目
  relevantResourcesOrNotesFromWholeSpace.forEach(addUniqueItem);

  // 保留原始的 collections
  processedContext.collections = collections;

  return processedContext;
}

export function deduplicateContexts(context: IContext): IContext {
  return {
    contentList: uniqBy(context.contentList || [], 'content'),
    resources: uniqBy(context.resources || [], (item) => item.resource?.content),
    notes: uniqBy(context.notes || [], (item) => item.note?.content),
    webSearchSources: uniqBy(context.webSearchSources || [], (item) => item?.pageContent),
  };
}

export function removeOverlappingContextItems(context: IContext, originalContext: IContext): IContext {
  const deduplicatedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
  };

  // Helper function to check if an item exists in the context
  const itemExistsInContext = (item: any, contextArray: any[], idField: string) => {
    return contextArray.some((contextItem) => contextItem[idField] === item[idField]);
  };

  // Deduplicate contentList
  deduplicatedContext.contentList = originalContext.contentList.filter(
    (item) => !itemExistsInContext(item, context.contentList, 'metadata.entityId'),
  );

  // Deduplicate resources
  deduplicatedContext.resources = originalContext.resources.filter(
    (item) =>
      !itemExistsInContext(
        item.resource,
        context.resources.map((r) => r.resource),
        'resourceId',
      ),
  );

  // Deduplicate notes
  deduplicatedContext.notes = originalContext.notes.filter(
    (item) =>
      !itemExistsInContext(
        item.note,
        context.notes.map((n) => n.note),
        'noteId',
      ),
  );

  return deduplicatedContext;
}

export const mutateContextMetadata = (mentionedContext: IContext, originalContext: IContext): IContext => {
  // Process notes
  mentionedContext.notes.forEach((mentionedNote) => {
    const index = originalContext.notes.findIndex((n) => n.note.noteId === mentionedNote.note.noteId);
    if (index !== -1) {
      originalContext.notes[index] = {
        ...originalContext.notes[index],
        metadata: {
          ...originalContext.notes[index].metadata,
          useWholeContent: mentionedNote.metadata?.useWholeContent,
        },
      };
    }
  });

  // Process resources
  mentionedContext.resources.forEach((mentionedResource) => {
    const index = originalContext.resources.findIndex(
      (r) => r.resource.resourceId === mentionedResource.resource.resourceId,
    );
    if (index !== -1) {
      originalContext.resources[index] = {
        ...originalContext.resources[index],
        metadata: {
          ...originalContext.resources[index].metadata,
          useWholeContent: mentionedResource.metadata?.useWholeContent,
        },
      };
    }
  });

  // Process contentList
  mentionedContext.contentList.forEach((mentionedContent) => {
    const index = originalContext.contentList.findIndex(
      (c) => c.metadata.entityId === mentionedContent.metadata.entityId,
    );
    if (index !== -1) {
      originalContext.contentList[index] = {
        ...originalContext.contentList[index],
        metadata: {
          ...originalContext.contentList[index].metadata,
          useWholeContent: mentionedContent.metadata?.useWholeContent,
        },
      };
    }
  });

  return originalContext;
};
