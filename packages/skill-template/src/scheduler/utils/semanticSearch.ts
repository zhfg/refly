import {
  SkillContextContentItem,
  SkillContextResourceItem,
  SkillContextNoteItem,
  SearchDomain,
  EntityType,
  SkillContextCollectionItem,
  Entity,
} from '@refly/openapi-schema';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { IContext, GraphState, SkillContextContentItemMetadata } from '../types';
import { countToken, ModelContextLimitMap } from './token';
import { MAX_NEED_RECALL_TOKEN, SHORT_CONTENT_THRESHOLD, MIN_RELEVANCE_SCORE } from './constants';
import { DocumentInterface, Document } from '@langchain/core/documents';
import { ContentNodeType, NodeMeta } from '../../engine';
import { genUniqueId } from '@refly/utils';
import { truncateText } from './truncator';

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
  const uniqueId = genUniqueId();

  // 1. construct documents
  const documents: Document<NodeMeta>[] = contentList.map((item) => {
    return {
      pageContent: truncateText(item.content, MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        uniqueId,
        title: item.metadata?.title as string,
        nodeType: item.metadata?.entityType as ContentNodeType,
      },
    };
  });

  // 2. index documents
  await ctx.ctxThis.engine.service.inMemoryIndexDocuments(ctx.configSnapshot.user, { docs: documents });

  // 3. search by similarity
  const res = await ctx.ctxThis.engine.service.inMemorySearch(ctx.configSnapshot.user, {
    query,
    k: documents.length,
    filter: (doc) => doc.metadata.uniqueId === uniqueId,
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

export async function sortNotesBySimilarity(
  query: string,
  notes: SkillContextNoteItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextNoteItem[]> {
  const uniqueId = genUniqueId();

  // 1. construct documents
  const documents: Document<NodeMeta>[] = notes.map((item) => {
    return {
      pageContent: truncateText(item.note?.content || '', MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        uniqueId,
        title: item.note?.title as string,
        nodeType: 'note' as ContentNodeType,
        noteId: item.note?.noteId,
      },
    };
  });

  // 2. index documents
  await ctx.ctxThis.engine.service.inMemoryIndexDocuments(ctx.configSnapshot.user, { docs: documents });

  // 3. search by similarity
  const res = await ctx.ctxThis.engine.service.inMemorySearch(ctx.configSnapshot.user, {
    query,
    k: documents.length,
    filter: (doc) => doc.metadata.uniqueId === uniqueId,
  });
  const sortedNotes = res.data;

  // 4. return sorted notes
  return sortedNotes
    .map((item) => notes.find((note) => note.note?.noteId === item.metadata.noteId))
    .filter((note): note is SkillContextNoteItem => note !== undefined);
}

export async function sortResourcesBySimilarity(
  query: string,
  resources: SkillContextResourceItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextResourceItem[]> {
  const uniqueId = genUniqueId();

  // 1. construct documents
  const documents: Document<NodeMeta>[] = resources.map((item) => {
    return {
      pageContent: truncateText(item.resource?.content || '', MAX_NEED_RECALL_TOKEN),
      metadata: {
        ...item.metadata,
        uniqueId,
        title: item.resource?.title as string,
        nodeType: 'resource' as ContentNodeType,
        resourceId: item.resource?.resourceId,
      },
    };
  });

  // 2. index documents
  await ctx.ctxThis.engine.service.inMemoryIndexDocuments(ctx.configSnapshot.user, { docs: documents });

  // 3. search by similarity
  const res = await ctx.ctxThis.engine.service.inMemorySearch(ctx.configSnapshot.user, {
    query,
    k: documents.length,
    filter: (doc) => doc.metadata.uniqueId === uniqueId,
  });
  const sortedResources = res.data;

  // 4. return sorted resources
  return sortedResources
    .map((item) => resources.find((resource) => resource.resource?.resourceId === item.metadata.resourceId))
    .filter((resource): resource is SkillContextResourceItem => resource !== undefined);
}

export async function processSelectedContentWithSimilarity(
  query: string,
  contentList: SkillContextContentItem[],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextContentItem[]> {
  const MAX_RAG_RELEVANT_CONTENT_RATIO = 0.7;
  const MAX_SHORT_CONTENT_RATIO = 0.3;

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

    if (contentTokens > MAX_NEED_RECALL_TOKEN && !content.metadata?.useWholeContent) {
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

export async function processNotesWithSimilarity(
  query: string,
  notes: SkillContextNoteItem[],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextNoteItem[]> {
  const MAX_RAG_RELEVANT_NOTES_RATIO = 0.7;
  const MAX_SHORT_NOTES_RATIO = 0.3;

  const MAX_RAG_RELEVANT_NOTES_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_NOTES_RATIO);
  const MAX_SHORT_NOTES_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_NOTES_RATIO);

  if (notes.length === 0) {
    return [];
  }

  // 1. calculate similarity and sort
  let sortedNotes: SkillContextNoteItem[] = [];
  if (notes.length > 1) {
    sortedNotes = await sortNotesBySimilarity(query, notes, ctx);
  } else {
    sortedNotes = notes;
  }

  let result: SkillContextNoteItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 notes
  for (const note of sortedNotes) {
    const noteTokens = countToken(note?.note?.content || '');

    if (noteTokens > MAX_NEED_RECALL_TOKEN && !note.metadata?.useWholeContent) {
      // 1.1 大内容，直接走召回
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: note?.note?.noteId,
              entityType: 'note',
            },
          ],
          domains: ['note'],
          limit: 10,
        },
        ctx,
      );
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...note, note: { ...note.note!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    } else if (usedTokens + noteTokens <= MAX_RAG_RELEVANT_NOTES_MAX_TOKENS) {
      // 1.2 小内容，直接添加
      result.push(note);
      usedTokens += noteTokens;
    } else {
      // 1.3 达到 MAX_RAG_RELEVANT_NOTES_MAX_TOKENS，处理剩余内容
      break;
    }

    if (usedTokens >= MAX_RAG_RELEVANT_NOTES_MAX_TOKENS) break;
  }

  // 3. 处理剩余的 notes
  for (let i = result.length; i < sortedNotes.length; i++) {
    const remainingNote = sortedNotes[i];
    const noteTokens = countToken(remainingNote?.note?.content || '');

    // 所有的短内容直接添加
    if (noteTokens < SHORT_CONTENT_THRESHOLD) {
      result.push(remainingNote);
      usedTokens += noteTokens;
    } else {
      // 剩下的长内容走召回
      const remainingTokens = maxTokens - usedTokens;
      let relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entities: [
            {
              entityId: remainingNote?.note?.noteId,
              entityType: 'note',
            },
          ],
          domains: ['note'],
          limit: 10,
        },
        ctx,
      );
      relevantChunks = truncateChunks(relevantChunks, remainingTokens);
      const relevantContent = assembleChunks(relevantChunks);
      result.push({ ...remainingNote, note: { ...remainingNote.note!, content: relevantContent } });
      usedTokens += countToken(relevantContent);
    }
  }

  return result;
}

export async function processResourcesWithSimilarity(
  query: string,
  resources: SkillContextResourceItem[],
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<SkillContextResourceItem[]> {
  const MAX_RAG_RELEVANT_RESOURCES_RATIO = 0.7;
  const MAX_SHORT_RESOURCES_RATIO = 0.3;

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
  const MAX_NOTE_RAG_RELEVANT_RATIO = 0.3;

  const MAX_CONTENT_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_CONTENT_RAG_RELEVANT_RATIO);
  const MAX_RESOURCE_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_RESOURCE_RAG_RELEVANT_RATIO);
  const MAX_NOTE_RAG_RELEVANT_MAX_TOKENS = Math.floor(maxTokens * MAX_NOTE_RAG_RELEVANT_RATIO);

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

  // 处理 notes
  const processedNotes = await processNotesWithSimilarity(
    query,
    mentionedContext.notes,
    MAX_NOTE_RAG_RELEVANT_MAX_TOKENS,
    ctx,
  );

  // 返回处理后的上下文
  return {
    ...mentionedContext,
    contentList: processedContentList,
    resources: processedResources,
    notes: processedNotes,
  };
}

// lower priority, if out of maxTokens, prior to cut off
export async function processCollectionsWithSimilarity(
  query: string,
  collections: SkillContextCollectionItem[],
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<(SkillContextResourceItem | SkillContextNoteItem)[]> {
  if (collections.length === 0) {
    return [];
  }

  // 1. scope collections for get relevant chunks
  const entities: Entity[] = collections.map((collection) => ({
    entityId: collection?.collection?.collectionId,
    entityType: 'collection',
  }));
  const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
    query,
    {
      entities,
      domains: ['collection'],
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
  const result: (SkillContextResourceItem | SkillContextNoteItem)[] = [];
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
    } else if (domain === 'note') {
      result.push({
        note: {
          noteId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextNoteItem);
    }
    // 如果还有其他类型，可以在这里继续添加
  }

  return result;
}

export async function processWholeSpaceWithSimilarity(
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<(SkillContextResourceItem | SkillContextNoteItem)[]> {
  // 1. scope collections for get relevant chunks
  const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
    query,
    {
      entities: [],
      domains: ['resource', 'note'],
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
  const result: (SkillContextResourceItem | SkillContextNoteItem)[] = [];
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
    } else if (domain === 'note') {
      result.push({
        note: {
          noteId: id,
          content: assembledContent,
          title: groupedChunks[key][0].metadata.title,
          // 其他必要的字段需要根据实际情况填充
        },
      } as SkillContextNoteItem);
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
    pageContent: item?.content?.[0] || '',
    metadata: {
      ...item.metadata,
      title: item.title,
      domain: item.domain, // collection, resource, note
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
  const uniqueId = genUniqueId();
  const filter = (doc: Document<NodeMeta>) => {
    return doc.metadata.uniqueId === uniqueId;
  };
  const doc: Document<NodeMeta> = {
    pageContent: content,
    metadata: {
      nodeType: metadata.entityType,
      entityType: metadata.entityType,
      title: metadata.title,
      entityId: metadata.entityId,
      tenantId: ctx.configSnapshot.user.uid,
      uniqueId, // uniqueId for inMemorySearch
    },
  };
  await ctx.ctxThis.engine.service.inMemoryIndexContent(ctx.configSnapshot.user, { doc, needChunk: true });
  const res = await ctx.ctxThis.engine.service.inMemorySearch(ctx.configSnapshot.user, {
    query,
    k: 10,
    filter,
  });
  const relevantChunks = res?.data as DocumentInterface[];

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
