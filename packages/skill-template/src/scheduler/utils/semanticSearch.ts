import {
  SkillContextContentItem,
  SkillContextResourceItem,
  SkillContextCanvasItem,
  SearchDomain,
  SkillContextProjectItem,
  Entity,
} from '@refly-packages/openapi-schema';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { IContext, GraphState, SkillContextContentItemMetadata } from '../types';
import { countToken, ModelContextLimitMap } from './token';
import { MAX_NEED_RECALL_TOKEN, SHORT_CONTENT_THRESHOLD, MIN_RELEVANCE_SCORE } from './constants';
import { DocumentInterface, Document } from '@langchain/core/documents';
import { ContentNodeType, NodeMeta } from '../../engine';
import { truncateText } from './truncator';
import {
  MAX_RAG_RELEVANT_CONTENT_RATIO,
  MAX_SHORT_CONTENT_RATIO,
  MAX_RAG_RELEVANT_CANVASES_RATIO,
  MAX_SHORT_CANVASES_RATIO,
  MAX_RAG_RELEVANT_RESOURCES_RATIO,
  MAX_SHORT_RESOURCES_RATIO,
} from './constants';

// TODO:替换成实际的 Chunk 定义，然后进行拼接，拼接时包含元数据和分隔符
export function assembleChunks(chunks: DocumentInterface[] = []): string {
  // if chunks has metadata.start, sort by start
  if (chunks?.[0]?.metadata?.start) {
    chunks.sort((a, b) => a.metadata.start - b.metadata.start);
  }

  return chunks.map((chunk) => chunk.pageContent).join('\n [...] \n');
}

export async function sortContentBySimilarity(
  query: string,
  contentList: SkillContextContentItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextContentItem[]> {
  // 1. construct documents
  const documents: Document<NodeMeta>[] = contentList.map((item) => {
    return {
      pageContent: truncateText(item.content, MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        title: item.metadata?.title as string,
        nodeType: item.metadata?.entityType as ContentNodeType,
      },
    };
  });

  // 2. index documents
  const res = await ctx.ctxThis.engine.service.inMemorySearchWithIndexing(ctx.configSnapshot.user, {
    content: documents,
    query,
    k: documents.length,
    filter: undefined,
  });
  const sortedContent = res.data;

  // 4. return sorted content
  return sortedContent.map((item) => ({
    content: item.pageContent,
    metadata: {
      ...item.metadata,
    },
  }));
}

export async function sortCanvasesBySimilarity(
  query: string,
  canvases: SkillContextCanvasItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextCanvasItem[]> {
  // 1. construct documents
  const documents: Document<NodeMeta>[] = canvases.map((item) => {
    return {
      pageContent: truncateText(item.canvas?.content || '', MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        title: item.canvas?.title as string,
        nodeType: 'canvas' as ContentNodeType,
        canvasId: item.canvas?.canvasId,
      },
    };
  });

  // 2. index documents
  const res = await ctx.ctxThis.engine.service.inMemorySearchWithIndexing(ctx.configSnapshot.user, {
    content: documents,
    query,
    k: documents.length,
    filter: undefined,
  });
  const sortedCanvases = res.data;

  // 4. return sorted canvases
  return sortedCanvases
    .map((item) => canvases.find((canvas) => canvas.canvas?.canvasId === item.metadata.canvasId))
    .filter((canvas): canvas is SkillContextCanvasItem => canvas !== undefined);
}

export async function sortResourcesBySimilarity(
  query: string,
  resources: SkillContextResourceItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextResourceItem[]> {
  // 1. construct documents
  const documents: Document<NodeMeta>[] = resources.map((item) => {
    return {
      pageContent: truncateText(item.resource?.content || '', MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        title: item.resource?.title as string,
        nodeType: 'resource' as ContentNodeType,
        resourceId: item.resource?.resourceId,
      },
    };
  });

  // 2. index documents
  const res = await ctx.ctxThis.engine.service.inMemorySearchWithIndexing(ctx.configSnapshot.user, {
    content: documents,
    query,
    k: documents.length,
    filter: undefined,
  });
  const sortedResources = res.data;

  // 4. return sorted resources
  return sortedResources
    .map((item) => resources.find((resource) => resource.resource?.resourceId === item.metadata.resourceId))
    .filter((resource): resource is SkillContextResourceItem => resource !== undefined);
}

export async function processSelectedContentWithSimilarity(
  query: string,
  contentList: SkillContextContentItem[] = [],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextContentItem[]> {
  const MAX_RAG_RELEVANT_CONTENT_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_CONTENT_RATIO);
  const MAX_SHORT_CONTENT_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_CONTENT_RATIO);

  if (contentList.length === 0) {
    return [];
  }

  // 1. calculate similarity and sort
  let sortedContent: SkillContextContentItem[] = [];
  if (contentList.length > 1) {
    sortedContent = await sortContentBySimilarity(query, contentList, ctx);
  } else {
    sortedContent = contentList;
  }

  let result: SkillContextContentItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 content
  for (const content of sortedContent) {
    const contentTokens = countToken(content.content);

    if (contentTokens > MAX_NEED_RECALL_TOKEN || !content.metadata?.useWholeContent) {
      // 2.1 大内容，直接走召回
      const contentMeta = content?.metadata as any as SkillContextContentItemMetadata;
      const relevantChunks = await inMemoryGetRelevantChunks(
        query,
        content.content,
        {
          entityId: contentMeta?.entityId,
          title: contentMeta?.title,
          entityType: contentMeta?.domain,
        },
        ctx,
      );
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...content, content: relevantContent });
      usedTokens += countToken(relevantContent);
    } else if (usedTokens + contentTokens <= MAX_RAG_RELEVANT_CONTENT_MAX_TOKENS) {
      // 2.2 小内容，直接添加
      result.push(content);
      usedTokens += contentTokens;
    } else {
      // 2.3 达到 MAX_RAG_RELEVANT_CONTENT_MAX_TOKENS，处理剩余内容
      break;
    }

    if (usedTokens >= MAX_RAG_RELEVANT_CONTENT_MAX_TOKENS) break;
  }

  // 3. 处理剩余的 content
  for (let i = result.length; i < sortedContent.length; i++) {
    const remainingContent = sortedContent[i];
    const contentTokens = countToken(remainingContent.content);

    // 所有的短内容直接添加
    if (contentTokens < SHORT_CONTENT_THRESHOLD) {
      result.push(remainingContent);
      usedTokens += contentTokens;
    } else {
      // 剩下的长内容走召回
      const remainingTokens = maxTokens - usedTokens;
      const contentMeta = remainingContent?.metadata as any as SkillContextContentItemMetadata;
      let relevantChunks = await inMemoryGetRelevantChunks(
        query,
        remainingContent.content,
        {
          entityId: contentMeta?.entityId,
          title: contentMeta?.title,
          entityType: contentMeta?.domain,
        },
        ctx,
      );
      relevantChunks = truncateChunks(relevantChunks, remainingTokens);
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...remainingContent, content: relevantContent });
      usedTokens += countToken(relevantContent);
    }

    if (usedTokens >= maxTokens) break;
  }

  return result;
}

export async function processCanvasesWithSimilarity(
  query: string,
  canvases: SkillContextCanvasItem[] = [],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextCanvasItem[]> {
  const MAX_RAG_RELEVANT_CANVASES_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_CANVASES_RATIO);
  const MAX_SHORT_CANVASES_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_CANVASES_RATIO);

  if (canvases.length === 0) {
    return [];
  }

  // 1. calculate similarity and sort
  let sortedCanvases: SkillContextCanvasItem[] = [];
  if (canvases.length > 1) {
    sortedCanvases = await sortCanvasesBySimilarity(query, canvases, ctx);
  } else {
    sortedCanvases = canvases;
  }

  let result: SkillContextCanvasItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 canvas
  for (const canvas of sortedCanvases) {
    const canvasTokens = countToken(canvas?.canvas?.content || '');

    if (canvasTokens > MAX_NEED_RECALL_TOKEN || !canvas.metadata?.useWholeContent) {
      // 1.1 大内容，直接走召回
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: canvas?.canvas?.canvasId,
              entityType: 'canvas',
            },
          ],
          domains: ['canvas'],
          limit: 10,
        },
        ctx,
      );
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...canvas, canvas: { ...canvas.canvas!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    } else if (usedTokens + canvasTokens <= MAX_RAG_RELEVANT_CANVASES_MAX_TOKENS) {
      // 1.2 小内容，直接添加
      result.push(canvas);
      usedTokens += canvasTokens;
    } else {
      // 1.3 达到 MAX_RAG_RELEVANT_CANVASES_MAX_TOKENS，处理剩余内容
      break;
    }

    if (usedTokens >= MAX_RAG_RELEVANT_CANVASES_MAX_TOKENS) break;
  }

  // 3. 处理剩余的 canvas
  for (let i = result.length; i < sortedCanvases.length; i++) {
    const remainingCanvas = sortedCanvases[i];
    const canvasTokens = countToken(remainingCanvas?.canvas?.content || '');

    // 所有的短内容直接添加
    if (canvasTokens < SHORT_CONTENT_THRESHOLD) {
      result.push(remainingCanvas);
      usedTokens += canvasTokens;
    } else {
      // 剩下的长内容走召回
      const remainingTokens = maxTokens - usedTokens;
      let relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: remainingCanvas?.canvas?.canvasId,
              entityType: 'canvas',
            },
          ],
          domains: ['canvas'],
          limit: 10,
        },
        ctx,
      );
      relevantChunks = truncateChunks(relevantChunks, remainingTokens);
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...remainingCanvas, canvas: { ...remainingCanvas.canvas!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    }
  }

  return result;
}

export async function processResourcesWithSimilarity(
  query: string,
  resources: SkillContextResourceItem[] = [],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextResourceItem[]> {
  const MAX_RAG_RELEVANT_RESOURCES_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_RESOURCES_RATIO);
  const MAX_SHORT_RESOURCES_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_RESOURCES_RATIO);

  if (resources.length === 0) {
    return [];
  }

  // 1. calculate similarity and sort
  let sortedResources: SkillContextResourceItem[] = [];
  if (resources.length > 1) {
    sortedResources = await sortResourcesBySimilarity(query, resources, ctx);
  } else {
    sortedResources = resources;
  }

  let result: SkillContextResourceItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 resources
  for (const resource of sortedResources) {
    const resourceTokens = countToken(resource?.resource?.content || '');

    if (resourceTokens > MAX_NEED_RECALL_TOKEN || !resource.metadata?.useWholeContent) {
      // 2.1 大内容，直接走召回
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: resource?.resource?.resourceId,
              entityType: 'resource',
            },
          ],
          domains: ['resource'],
          limit: 10,
        },
        ctx,
      );
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...resource, resource: { ...resource.resource!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    } else if (usedTokens + resourceTokens <= MAX_RAG_RELEVANT_RESOURCES_MAX_TOKENS) {
      // 2.2 小内容，直接添加
      result.push(resource);
      usedTokens += resourceTokens;
    } else {
      // 2.3 达到 MAX_RAG_RELEVANT_RESOURCES_MAX_TOKENS，处理剩余内容
      break;
    }

    if (usedTokens >= MAX_RAG_RELEVANT_RESOURCES_MAX_TOKENS) break;
  }

  // 3. 处理剩余的 resources，目前考虑所有资源，等实际运行看是否存在超出的
  // for (let i = result.length; i < sortedResources.length && usedTokens < maxTokens; i++) {
  for (let i = result.length; i < sortedResources.length; i++) {
    const remainingResource = sortedResources[i];
    const resourceTokens = countToken(remainingResource?.resource?.content || '');

    // 所有的短内容直接添加
    if (resourceTokens < SHORT_CONTENT_THRESHOLD) {
      result.push(remainingResource);
      usedTokens += resourceTokens;
    } else {
      // 长内容走召回
      const remainingTokens = maxTokens - usedTokens;
      let relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: remainingResource?.resource?.resourceId,
              entityType: 'resource',
            },
          ],
          domains: ['resource'],
          limit: 10,
        },
        ctx,
      );
      relevantChunks = truncateChunks(relevantChunks, remainingTokens);
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...remainingResource, resource: { ...remainingResource.resource!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    }
  }

  return result;
}

export async function processMentionedContextWithSimilarity(
  query: string,
  mentionedContext: IContext,
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<IContext> {
  const MAX_CONTENT_RAG_RELEVANT_RATIO = 0.4;
  const MAX_RESOURCE_RAG_RELEVANT_RATIO = 0.3;
  const MAX_CANVAS_RAG_RELEVANT_RATIO = 0.3;

  const MAX_CONTENT_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_CONTENT_RAG_RELEVANT_RATIO);
  const MAX_RESOURCE_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_RESOURCE_RAG_RELEVANT_RATIO);
  const MAX_CANVAS_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_CANVAS_RAG_RELEVANT_RATIO);

  // 处理 contentList
  const processedContentList = await processSelectedContentWithSimilarity(
    query,
    mentionedContext.contentList,
    MAX_CONTENT_RAG_RELEVANT_MAX_TOKENS,
    ctx,
  );

  // 处理 resources
  const processedResources = await processResourcesWithSimilarity(
    query,
    mentionedContext.resources,
    MAX_RESOURCE_RAG_RELEVANT_MAX_TOKENS,
    ctx,
  );

  // 处理 canvases
  const processedCanvases = await processCanvasesWithSimilarity(
    query,
    mentionedContext.canvases,
    MAX_CANVAS_RAG_RELEVANT_MAX_TOKENS,
    ctx,
  );

  // 返回处理后的上下文
  return {
    ...mentionedContext,
    contentList: processedContentList,
    resources: processedResources,
    canvases: processedCanvases,
  };
}

// lower priority, if out of maxTokens, prior to cut off
export async function processProjectsWithSimilarity(
  query: string,
  projects: SkillContextProjectItem[] = [],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<(SkillContextResourceItem | SkillContextCanvasItem)[]> {
  if (projects?.length === 0) {
    return [];
  }

  // 1. scope projects for get relevant chunks
  const entities: Entity[] = projects.map((project) => ({
    entityId: project?.project?.projectId,
    entityType: 'project',
  }));
  const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
    query,
    {
      entities,
      domains: ['project'],
      limit: 10,
    },
    ctx,
  );

  // 2. 按照 domain 和 id 进行分类
  const groupedChunks: { [key: string]: DocumentInterface[] } = {};
  relevantChunks.forEach((chunk) => {
    const key = `${chunk.metadata.domain}_${chunk.id}`;
    if (!groupedChunks[key]) {
      groupedChunks[key] = [];
    }
    groupedChunks[key].push(chunk);
  });

  // 3. 组装结果
  const result: (SkillContextResourceItem | SkillContextCanvasItem)[] = [];
  for (const key in groupedChunks) {
    const [domain, id] = key.split('_');
    const assembledContent = assembleChunks(groupedChunks[key]);

    if (domain === 'resource') {
      result.push({
        resource: {
          resourceId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextResourceItem);
    } else if (domain === 'canvas') {
      result.push({
        canvas: {
          canvasId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextCanvasItem);
    }
    // 如果还有其他类型，可以在这里继续添加
  }

  return result;
}

export async function processWholeSpaceWithSimilarity(
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<(SkillContextResourceItem | SkillContextCanvasItem)[]> {
  // 1. scope projects for get relevant chunks
  const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
    query,
    {
      entities: [],
      domains: ['resource', 'canvas'],
      limit: 10,
    },
    ctx,
  );

  // 2. 按照 domain 和 id 进行分类
  const groupedChunks: { [key: string]: DocumentInterface[] } = {};
  relevantChunks.forEach((chunk) => {
    const key = `${chunk.metadata.domain}_${chunk.id}`;
    if (!groupedChunks[key]) {
      groupedChunks[key] = [];
    }
    groupedChunks[key].push(chunk);
  });

  // 3. 组装结果
  const result: (SkillContextResourceItem | SkillContextCanvasItem)[] = [];
  for (const key in groupedChunks) {
    const [domain, id] = key.split('_');
    const assembledContent = assembleChunks(groupedChunks[key]);

    if (domain === 'resource') {
      result.push({
        resource: {
          resourceId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextResourceItem);
    } else if (domain === 'canvas') {
      result.push({
        canvas: {
          canvasId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextCanvasItem);
    }
    // 如果还有其他类型，可以在这里继续添加
  }

  return result;
}

// TODO: 召回有问题，需要优化
export async function knowledgeBaseSearchGetRelevantChunks(
  query: string,
  metadata: { entities: Entity[]; domains: SearchDomain[]; limit: number },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<DocumentInterface[]> {
  // 1. search relevant chunks
  const res = await ctx.ctxThis.engine.service.search(
    ctx.configSnapshot.user,
    {
      query,
      entities: metadata.entities,
      mode: 'vector',
      limit: metadata.limit,
      domains: metadata.domains,
    },
    { enableReranker: false },
  );
  const relevantChunks = res?.data?.map((item) => ({
    id: item.id,
    pageContent: item?.snippets?.map((s) => s.text).join('\n\n') || '',
    metadata: {
      ...item.metadata,
      title: item.title,
      domain: item.domain, // project, resource, canvas
    },
  }));

  return relevantChunks;
}

// TODO: 召回有问题，需要优化
export async function inMemoryGetRelevantChunks(
  query: string,
  content: string,
  metadata: { entityId: string; title: string; entityType: ContentNodeType },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<DocumentInterface[]> {
  // 1. 获取 relevantChunks
  const doc: Document<NodeMeta> = {
    pageContent: content,
    metadata: {
      nodeType: metadata.entityType,
      entityType: metadata.entityType,
      title: metadata.title,
      entityId: metadata.entityId,
      tenantId: ctx.configSnapshot.user.uid,
    },
  };
  const res = await ctx.ctxThis.engine.service.inMemorySearchWithIndexing(ctx.configSnapshot.user, {
    content: doc,
    query,
    k: 10,
    filter: undefined,
    needChunk: true,
    additionalMetadata: {},
  });
  const relevantChunks = res.data as DocumentInterface[];

  return relevantChunks;
}

export function truncateChunks(chunks: DocumentInterface[], maxTokens: number): DocumentInterface[] {
  let result: DocumentInterface[] = [];
  let usedTokens = 0;

  for (const chunk of chunks) {
    const chunkTokens = countToken(chunk.pageContent);
    if (usedTokens + chunkTokens <= maxTokens) {
      result.push(chunk as DocumentInterface);
      usedTokens += chunkTokens;
    } else {
      break;
    }
  }

  return result;
}
