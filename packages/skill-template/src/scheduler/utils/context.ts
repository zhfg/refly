import { GraphState, IContext, SkillContextContentItemMetadata } from '../types';
import {
  countContentTokens,
  countContextTokens,
  countResourceTokens,
  countToken,
  countWebSearchContextTokens,
  checkHasContext,
} from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processCanvasesWithSimilarity,
  processResourcesWithSimilarity,
  processWholeSpaceWithSimilarity,
  processMentionedContextWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { mergeAndTruncateContexts, truncateContext, truncateText } from './truncator';
import { flattenMergedContextToSources, concatMergedContextToStr } from './summarizer';
import {
  SkillContextContentItem,
  SkillContextDocumentItem,
  SkillContextResourceItem,
  SkillTemplateConfig,
  Source,
} from '@refly-packages/openapi-schema';
import { uniqBy } from 'lodash';
import { MAX_CONTEXT_RATIO } from './constants';
import { safeStringifyJSON } from '@refly-packages/utils';
import { callMultiLingualWebSearch } from '../module/multiLingualSearch';

export async function prepareContext(
  {
    query,
    mentionedContext,
    maxTokens,
    enableMentionedContext,
    enableLowerPriorityContext,
  }: {
    query: string;
    mentionedContext: IContext;
    maxTokens: number;
    enableMentionedContext: boolean;
    enableLowerPriorityContext: boolean;
  },
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<{ contextStr: string; sources: Source[] }> {
  ctx.ctxThis.emitEvent({ event: 'log', content: `Start to prepare context...` }, ctx.config);

  const enableWebSearch = ctx.tplConfig?.enableWebSearch?.value;
  const enableKnowledgeBaseSearch = ctx.tplConfig?.enableKnowledgeBaseSearch?.value;
  ctx.ctxThis.engine.logger.log(`Enable Web Search: ${enableWebSearch}`);
  ctx.ctxThis.engine.logger.log(`Enable Knowledge Base Search: ${enableKnowledgeBaseSearch}`);

  const maxContextTokens = Math.floor(maxTokens * MAX_CONTEXT_RATIO);
  // TODO: think remainingTokens may out of range
  let remainingTokens = maxContextTokens;
  ctx.ctxThis.engine.logger.log(`Max Context Tokens: ${maxContextTokens}`);

  // 1. web search context
  let processedWebSearchContext: IContext = {
    contentList: [],
    resources: [],
    documents: [],
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
    documents: [],
    projects: [],
  };
  if (enableMentionedContext) {
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
    documents: [],
    projects: [],
  };
  if (remainingTokens > 0 && (enableMentionedContext || enableKnowledgeBaseSearch)) {
    const { contentList = [], resources = [], documents = [], projects = [] } = ctx.config.configurable;
    // prev remove overlapping items in mentioned context
    ctx.ctxThis.engine.logger.log(
      `Remove Overlapping Items In Mentioned Context...
      - mentionedContext: ${safeStringifyJSON(processedMentionedContext)}
      - context: ${safeStringifyJSON({
        contentList,
        resources,
        documents,
        projects,
      })}
      `,
    );

    const context = removeOverlappingContextItems(processedMentionedContext, {
      contentList,
      resources,
      documents,
      projects,
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

  const hasMentionedContext = checkHasContext(processedMentionedContext);
  const hasLowerPriorityContext = checkHasContext(deduplicatedLowerPriorityContext);

  // may optimize web search sources by context
  const LIMIT_WEB_SEARCH_SOURCES_COUNT = 10;
  if (hasMentionedContext || hasLowerPriorityContext) {
    mergedContext.webSearchSources = mergedContext.webSearchSources.slice(0, LIMIT_WEB_SEARCH_SOURCES_COUNT);
  }

  // TODO: need add rerank here
  const contextStr = concatMergedContextToStr(mergedContext);
  const sources = flattenMergedContextToSources(mergedContext);

  ctx.ctxThis.engine.logger.log(
    `- contextStr: ${contextStr}
     - sources: ${safeStringifyJSON(sources)}`,
  );

  ctx.ctxThis.emitEvent({ event: 'log', content: `Prepared context successfully!` }, ctx.config);
  ctx.ctxThis.engine.logger.log(`Prepared context successfully! ${safeStringifyJSON(mergedContext)}`);

  return { contextStr, sources };
}

export async function prepareWebSearchContext(
  {
    query,
  }: {
    query: string;
  },
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<{
  processedWebSearchContext: IContext;
}> {
  ctx.ctxThis.engine.logger.log(`Prepare Web Search Context...`);

  // two searchMode
  const enableDeepReasonWebSearch = (ctx.tplConfig?.enableDeepReasonWebSearch?.value as boolean) || false;
  const { locale = 'en' } = ctx?.config?.configurable || {};

  let searchLimit = 10;
  let searchLocaleListLen = 2;
  let enableRerank = true;
  let enableTranslateQuery = false;
  let searchLocaleList: string[] = ['en'];
  let rerankRelevanceThreshold = 0.2;

  if (enableDeepReasonWebSearch) {
    searchLimit = 20;
    searchLocaleListLen = 3;
    enableTranslateQuery = true;
    rerankRelevanceThreshold = 0.4;
  }

  const processedWebSearchContext: IContext = {
    contentList: [],
    resources: [],
    documents: [],
    webSearchSources: [],
  };

  // Call multiLingualWebSearch instead of webSearch
  const searchResult = await callMultiLingualWebSearch(
    {
      searchLimit,
      searchLocaleList,
      resultDisplayLocale: locale || 'auto',
      enableRerank,
      enableTranslateQuery,
      enableTranslateResult: false,
      rerankRelevanceThreshold,
      translateConcurrencyLimit: 10,
      webSearchConcurrencyLimit: 3,
      batchSize: 5,
      enableDeepReasonWebSearch,
    },
    {
      config: ctx.config,
      ctxThis: ctx.ctxThis,
      state: { ...ctx.state, query },
    },
  );

  // Take only first 10 sources
  const webSearchSources = searchResult.sources || [];

  processedWebSearchContext.webSearchSources = webSearchSources;

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
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  mentionedContextTokens: number;
  processedMentionedContext: IContext;
}> {
  ctx.ctxThis.engine.logger.log(`Prepare Mentioned Context...`);

  let processedMentionedContext: IContext = {
    contentList: [],
    resources: [],
    documents: [],
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
    const { contentList = [], resources = [], documents = [] } = ctx.config.configurable;
    const context: IContext = {
      contentList,
      resources,
      documents,
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
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
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
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<IContext> {
  const { contentList = [], resources = [], documents = [] } = context;
  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    documents: [],
  };

  ctx.ctxThis.engine.logger.log(`Prepare Relevant Context..., ${safeStringifyJSON(context)}`);

  // 1. selected content context
  relevantContexts.contentList =
    contentList.length > 0 ? await processSelectedContentWithSimilarity(query, contentList, Infinity, ctx) : [];

  // 2. documents context
  relevantContexts.documents =
    documents.length > 0 ? await processCanvasesWithSimilarity(query, documents, Infinity, ctx) : [];

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
  ctx: { config: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<IContext> {
  const enableKnowledgeBaseSearch = ctx.tplConfig?.enableKnowledgeBaseSearch?.value;
  const enableSearchWholeSpace = enableKnowledgeBaseSearch;

  const processedContext: IContext = {
    contentList: [],
    resources: [],
    documents: [],
    projects: [],
  };

  const { projects } = context;

  ctx.ctxThis.engine.logger.log(
    `Prepare Container Level Context..., 
     - context: ${safeStringifyJSON(context)}
     - enableKnowledgeBaseSearch: ${enableKnowledgeBaseSearch}
     - enableSearchWholeSpace: ${enableSearchWholeSpace}
     - processedContext: ${safeStringifyJSON(processedContext)}`,
  );

  // 2. whole space search context
  const relevantResourcesOrCanvasesFromWholeSpace = enableSearchWholeSpace
    ? await processWholeSpaceWithSimilarity(query, ctx)
    : [];

  // 3. Group by resource and canvas, deduplicate, and place in processedContext
  const uniqueResourceIds = new Set<string>();
  const uniqueDocIds = new Set<string>();

  const addUniqueItem = (item: SkillContextResourceItem | SkillContextDocumentItem) => {
    if ('resource' in item && item.resource) {
      const resourceId = item.resource.resourceId;
      if (!uniqueResourceIds.has(resourceId)) {
        uniqueResourceIds.add(resourceId);
        processedContext.resources.push(item);
      }
    } else if ('document' in item && item.document) {
      const docId = item.document.docId;
      if (!uniqueDocIds.has(docId)) {
        uniqueDocIds.add(docId);
        processedContext.documents.push(item);
      }
    }
  };

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
    documents: uniqBy(context.documents || [], (item) => item.document?.content),
    webSearchSources: uniqBy(context.webSearchSources || [], (item) => item?.pageContent),
  };
}

export function removeOverlappingContextItems(context: IContext, originalContext: IContext): IContext {
  const deduplicatedContext: IContext = {
    contentList: [],
    resources: [],
    documents: [],
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
  deduplicatedContext.documents = (originalContext?.documents || []).filter(
    (item) =>
      !itemExistsInContext(
        item.document,
        (context?.documents || []).map((n) => n.document),
        'docId',
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
  mentionedContext.documents.forEach((mentionedCanvas) => {
    const index = originalContext.documents.findIndex((n) => n.document.docId === mentionedCanvas.document.docId);
    if (index !== -1) {
      originalContext.documents[index] = {
        ...originalContext.documents[index],
        metadata: {
          ...originalContext.documents[index].metadata,
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
