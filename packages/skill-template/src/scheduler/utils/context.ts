import { ChatMode, GraphState, IContext, SkillContextContentItemMetadata } from '../types';
import {
  countContentTokens,
  countContextTokens,
  countCanvasTokens,
  countResourceTokens,
  countToken,
  countWebSearchContextTokens,
} from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processCanvasesWithSimilarity,
  processResourcesWithSimilarity,
  processProjectsWithSimilarity,
  processWholeSpaceWithSimilarity,
  processMentionedContextWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { mergeAndTruncateContexts, truncateContext, truncateText } from './truncator';
import { flattenMergedContextToSources, concatMergedContextToStr } from './summarizer';
import {
  SkillContextContentItem,
  SkillContextCanvasItem,
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
    canvases: [],
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
    canvases: [],
    projects: [],
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
    canvases: [],
    projects: [],
  };
  if (remainingTokens > 0 && (hasContext || chatMode === ChatMode.WHOLE_SPACE_SEARCH)) {
    const { contentList = [], resources = [], canvases = [], projects = [] } = ctx.configSnapshot.configurable;
    // prev remove overlapping items in mentioned context
    ctx.ctxThis.engine.logger.log(
      `Remove Overlapping Items In Mentioned Context...
      - mentionedContext: ${safeStringifyJSON(processedMentionedContext)}
      - context: ${safeStringifyJSON({
        contentList,
        resources,
        canvases,
        projects,
      })}
      `,
    );

    const context = removeOverlappingContextItems(processedMentionedContext, {
      contentList,
      resources,
      canvases,
      projects: projects,
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
    canvases: [],
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
    canvases: [],
    projects: [],
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
    const { contentList = [], resources = [], canvases = [] } = ctx.configSnapshot.configurable;
    const context: IContext = {
      contentList,
      resources,
      canvases,
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
  const { contentList = [], resources = [], canvases = [] } = context;
  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    canvases: [],
  };

  ctx.ctxThis.engine.logger.log(`Prepare Relevant Context..., ${safeStringifyJSON(context)}`);

  // 1. selected content context
  relevantContexts.contentList =
    contentList.length > 0 ? await processSelectedContentWithSimilarity(query, contentList, Infinity, ctx) : [];

  // 2. canvases context
  relevantContexts.canvases =
    canvases.length > 0 ? await processCanvasesWithSimilarity(query, canvases, Infinity, ctx) : [];

  // 3. resources context
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
    canvases: [],
    projects: [],
  };

  const { projects } = context;

  ctx.ctxThis.engine.logger.log(
    `Prepare Container Level Context..., 
     - context: ${safeStringifyJSON(context)}
     - chatMode: ${chatMode}
     - enableSearchWholeSpace: ${enableSearchWholeSpace}
     - processedContext: ${safeStringifyJSON(processedContext)}`,
  );

  // 1. projects context, mainly for knowledge base search meat filter
  const relevantResourcesOrCanvasesFromProjects = await processProjectsWithSimilarity(query, projects, ctx);

  // 2. whole space search context
  const relevantResourcesOrCanvasesFromWholeSpace = enableSearchWholeSpace
    ? await processWholeSpaceWithSimilarity(query, ctx)
    : [];

  // 3. Group by resource and canvas, deduplicate, and place in processedContext
  const uniqueResourceIds = new Set<string>();
  const uniqueCanvasIds = new Set<string>();

  const addUniqueItem = (item: SkillContextResourceItem | SkillContextCanvasItem) => {
    if ('resource' in item && item.resource) {
      const resourceId = item.resource.resourceId;
      if (!uniqueResourceIds.has(resourceId)) {
        uniqueResourceIds.add(resourceId);
        processedContext.resources.push(item);
      }
    } else if ('canvas' in item && item.canvas) {
      const canvasId = item.canvas.canvasId;
      if (!uniqueCanvasIds.has(canvasId)) {
        uniqueCanvasIds.add(canvasId);
        processedContext.canvases.push(item);
      }
    }
  };

  // Add items from projects first
  relevantResourcesOrCanvasesFromProjects.forEach(addUniqueItem);

  // Then add items from whole space
  relevantResourcesOrCanvasesFromWholeSpace.forEach(addUniqueItem);

  // Keep original projects
  processedContext.projects = projects;

  ctx.ctxThis.engine.logger.log(
    `Prepared Container Level Context successfully! ${safeStringifyJSON(processedContext)}`,
  );

  return processedContext;
}

export function deduplicateContexts(context: IContext): IContext {
  return {
    contentList: uniqBy(context.contentList || [], 'content'),
    resources: uniqBy(context.resources || [], (item) => item.resource?.content),
    canvases: uniqBy(context.canvases || [], (item) => item.canvas?.content),
    webSearchSources: uniqBy(context.webSearchSources || [], (item) => item?.pageContent),
  };
}

export function removeOverlappingContextItems(context: IContext, originalContext: IContext): IContext {
  const deduplicatedContext: IContext = {
    contentList: [],
    resources: [],
    canvases: [],
    projects: [],
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

  // Deduplicate canvases
  deduplicatedContext.canvases = (originalContext?.canvases || []).filter(
    (item) =>
      !itemExistsInContext(
        item.canvas,
        (context?.canvases || []).map((n) => n.canvas),
        'canvasId',
      ),
  );

  // Deduplicate projects
  deduplicatedContext.projects = (originalContext?.projects || []).filter(
    (item) => !itemExistsInContext(item, context?.projects || [], 'projectId'),
  );

  return deduplicatedContext;
}

export const mutateContextMetadata = (mentionedContext: IContext, originalContext: IContext): IContext => {
  // Process canvases
  mentionedContext.canvases.forEach((mentionedCanvas) => {
    const index = originalContext.canvases.findIndex((n) => n.canvas.canvasId === mentionedCanvas.canvas.canvasId);
    if (index !== -1) {
      originalContext.canvases[index] = {
        ...originalContext.canvases[index],
        metadata: {
          ...originalContext.canvases[index].metadata,
          useWholeContent: mentionedCanvas.metadata?.useWholeContent,
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
