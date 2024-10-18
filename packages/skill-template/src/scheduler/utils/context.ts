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
import { MAX_CONTEXT_RATIO } from './constants';
import { safeStringifyJSON } from '@refly-packages/utils';

export async function prepareContext(
  {
    query,
    mentionedContext,
    maxTokens,
    hasContext,
  }: {
    query: string;
    mentionedContext: IContext;
    maxTokens: number;
    hasContext: boolean;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<string> {
  ctx.ctxThis.emitEvent({ event: 'log', content: `Start to prepare context...` }, ctx.configSnapshot);

  const enableWebSearch = ctx.tplConfig?.enableWebSearch?.value;
  const chatMode = ctx.tplConfig?.chatMode?.value as ChatMode;
  ctx.ctxThis.engine.logger.log(`Enable Web Search: ${enableWebSearch}`);

  const maxContextTokens = Math.floor(maxTokens * MAX_CONTEXT_RATIO);
  // TODO: think remainingTokens may out of range
  let remainingTokens = maxContextTokens;
  ctx.ctxThis.engine.logger.log(`Max Context Tokens: ${maxContextTokens}`);

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
  let processedMentionedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };
  if (hasContext) {
    const mentionContextRes = await prepareMentionedContext(
      {
        query,
        mentionedContext,
        maxMentionedContextTokens: remainingTokens,
      },
      ctx,
    );

    processedMentionedContext = mentionContextRes.processedMentionedContext;
    remainingTokens -= mentionContextRes.mentionedContextTokens || 0;
  }

  // 3. lower priority context
  let lowerPriorityContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };
  if (remainingTokens > 0 && (hasContext || chatMode === ChatMode.WHOLE_SPACE_SEARCH)) {
    const { contentList = [], resources = [], notes = [], collections = [] } = ctx.configSnapshot.configurable;
    // prev remove overlapping items in mentioned context
    ctx.ctxThis.engine.logger.log(
      `Remove Overlapping Items In Mentioned Context...
      - mentionedContext: ${safeStringifyJSON(processedMentionedContext)}
      - context: ${safeStringifyJSON({
        contentList,
        resources,
        notes,
        collections,
      })}
      `,
    );

    const context = removeOverlappingContextItems(processedMentionedContext, {
      contentList,
      resources,
      notes,
      collections,
    });

    lowerPriorityContext = await prepareLowerPriorityContext(
      {
        query,
        maxLowerPriorityContextTokens: remainingTokens,
        context,
        processedMentionedContext,
      },
      ctx,
    );
  }

  ctx.ctxThis.engine.logger.log(
    `Prepared Lower Priority before deduplication! ${safeStringifyJSON(lowerPriorityContext)}`,
  );

  const deduplicatedLowerPriorityContext = deduplicateContexts(lowerPriorityContext);
  const mergedContext = {
    mentionedContext: processedMentionedContext,
    lowerPriorityContext: deduplicatedLowerPriorityContext,
    webSearchSources: processedWebSearchContext.webSearchSources,
  };

  ctx.ctxThis.engine.logger.log(`Prepared Lower Priority after deduplication! ${safeStringifyJSON(mergedContext)}`);

  const contextStr = concatMergedContextToStr(mergedContext);
  const sources = flattenMergedContextToSources(mergedContext);

  ctx.ctxThis.engine.logger.log(
    `- contextStr: ${contextStr}
     - sources: ${safeStringifyJSON(sources)}`,
  );

  ctx.ctxThis.emitEvent(
    {
      event: 'structured_data',
      content: JSON.stringify(sources),
      structuredDataKey: 'sources',
    },
    ctx.configSnapshot,
  );

  ctx.ctxThis.emitEvent({ event: 'log', content: `Prepared context successfully!` }, ctx.configSnapshot);
  ctx.ctxThis.engine.logger.log(`Prepared context successfully! ${safeStringifyJSON(mergedContext)}`);

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
  ctx.ctxThis.emitEvent({ event: 'log', content: `Prepare Web Search Context...` }, ctx.configSnapshot);
  ctx.ctxThis.engine.logger.log(`Prepare Web Search Context...`);

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

  ctx.ctxThis.emitEvent({ event: 'log', content: `Prepared Web Search Context successfully!` }, ctx.configSnapshot);
  ctx.ctxThis.engine.logger.log(
    `Prepared Web Search Context successfully! ${safeStringifyJSON(processedWebSearchContext)}`,
  );

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
  ctx.ctxThis.engine.logger.log(`Prepare Mentioned Context...`);

  let processedMentionedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
    ...mentionedContext,
  };

  const allMentionedContextTokens = countContextTokens(mentionedContext);
  ctx.ctxThis.engine.logger.log(`All Mentioned Context Tokens: ${allMentionedContextTokens}`);

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

    ctx.ctxThis.engine.logger.log(`Mutate Context Metadata...`);
    mutateContextMetadata(mentionedContext, context);
  }

  let mentionedContextTokens = allMentionedContextTokens;

  if (allMentionedContextTokens > maxMentionedContextTokens) {
    ctx.ctxThis.engine.logger.log(`Process Mentioned Context With Similarity...`);
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

  ctx.ctxThis.engine.logger.log(
    `Prepared Mentioned Context successfully! ${safeStringifyJSON(processedMentionedContext)}`,
  );

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
    processedMentionedContext,
  }: {
    query: string;
    maxLowerPriorityContextTokens: number;
    context: IContext;
    processedMentionedContext: IContext;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<IContext> {
  ctx.ctxThis.engine.logger.log(`Prepare Lower Priority Context..., ${safeStringifyJSON(context)}`);

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

  // 3. remove overlapping items in container level context
  const removeOverlappingItemsInContainerLevelContext = removeOverlappingContextItems(
    relevantContext,
    removeOverlappingContextItems(processedMentionedContext, containerLevelContext),
  );

  const finalContext = await mergeAndTruncateContexts(
    relevantContext,
    removeOverlappingItemsInContainerLevelContext,
    query,
    maxLowerPriorityContextTokens,
    ctx,
  );

  ctx.ctxThis.engine.logger.log(`Prepared Lower Priority Context successfully! ${safeStringifyJSON(finalContext)}`);

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

  ctx.ctxThis.engine.logger.log(`Prepare Relevant Context..., ${safeStringifyJSON(context)}`);

  // 1. selected content context
  relevantContexts.contentList =
    contentList.length > 0 ? await processSelectedContentWithSimilarity(query, contentList, Infinity, ctx) : [];

  // 2. notes context
  relevantContexts.notes = notes.length > 0 ? await processNotesWithSimilarity(query, notes, Infinity, ctx) : [];

  // 3. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  relevantContexts.resources =
    resources.length > 0 ? await processResourcesWithSimilarity(query, resources, Infinity, ctx) : [];

  ctx.ctxThis.engine.logger.log(`Prepared Relevant Context successfully! ${safeStringifyJSON(relevantContexts)}`);

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

  ctx.ctxThis.engine.logger.log(
    `Prepare Container Level Context..., 
     - context: ${safeStringifyJSON(context)}
     - chatMode: ${chatMode}
     - enableSearchWholeSpace: ${enableSearchWholeSpace}
     - processedContext: ${safeStringifyJSON(processedContext)}`,
  );

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

  ctx.ctxThis.engine.logger.log(
    `Prepared Container Level Context successfully! ${safeStringifyJSON(processedContext)}`,
  );

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
    collections: [],
  };

  // Helper function to check if an item exists in the context
  const itemExistsInContext = (item: any, contextArray: any[] = [], idField: string) => {
    return contextArray.some((contextItem) => contextItem[idField] === item[idField]);
  };

  // Deduplicate contentList
  deduplicatedContext.contentList = (originalContext?.contentList || []).filter(
    (item) => !itemExistsInContext(item, context?.contentList || [], 'metadata.entityId'),
  );

  // Deduplicate resources
  deduplicatedContext.resources = (originalContext?.resources || []).filter(
    (item) =>
      !itemExistsInContext(
        item.resource,
        (context?.resources || []).map((r) => r.resource),
        'resourceId',
      ),
  );

  // Deduplicate notes
  deduplicatedContext.notes = (originalContext?.notes || []).filter(
    (item) =>
      !itemExistsInContext(
        item.note,
        (context?.notes || []).map((n) => n.note),
        'noteId',
      ),
  );

  // Deduplicate collections
  deduplicatedContext.collections = (originalContext?.collections || []).filter(
    (item) => !itemExistsInContext(item, context?.collections || [], 'collectionId'),
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
