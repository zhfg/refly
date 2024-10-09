import {
  SkillContextContentItem,
  SkillContextResourceItem,
  SkillContextNoteItem,
  SearchDomain,
  EntityType,
} from '@refly/openapi-schema';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { IContext, GraphState, SkillContextContentItemMetadata } from '../types';
import { countToken, ModelContextLimitMap } from './token';
import { MAX_NEED_RECALL_TOKEN, SHORT_CONTENT_THRESHOLD, MIN_RELEVANCE_SCORE } from './constants';
import { DocumentInterface, Document } from '@langchain/core/documents';
import { ContentNodeType, NodeMeta } from '../../engine';
import { genUniqueId } from '@refly/utils';

// TODO:替换成实际的 Chunk 定义，然后进行拼接，拼接时包含元数据和分隔符
export function assembleChunks(chunks: DocumentInterface[]): string {
  // 按照原始位置排序 chunks
  chunks.sort((a, b) => a.metadata.start - b.metadata.start);

  // 组装 chunks 为一个字符串，可能需要添加一些标记来指示不连续的部分
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
      pageContent: item.content,
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
      pageContent: item.note?.content || '',
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
      pageContent: item.resource?.content || '',
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

// TODO: 处理 collections 作为上下文召回，类似 Web 处理，collections 主要用户搜索范围
// export async function sortCollectionsBySimilarity(
//   query: string,
//   collections: SkillContextCollectionItem[],
// ): Promise<SkillContextCollectionItem[]> {
//   // 实现相似度计算和排序逻辑
//   // 这里可以使用向量数据库或其他相似度计算方法
//   // 返回按相似度排序的 collections
// }

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

  // 1. 计算相似度并排序
  const sortedContent = await sortContentBySimilarity(query, contentList, ctx);

  let result: SkillContextContentItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 content
  for (const content of sortedContent) {
    const contentTokens = countToken(content.content);

    if (contentTokens > MAX_NEED_RECALL_TOKEN) {
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
        MAX_NEED_RECALL_TOKEN,
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
      const relevantChunks = await inMemoryGetRelevantChunks(
        query,
        remainingContent.content,
        {
          entityId: contentMeta?.entityId,
          title: contentMeta?.title,
          entityType: contentMeta?.domain,
        },
        remainingTokens,
        ctx,
      );
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

  // 1. 计算相似度并排序
  const sortedNotes = await sortNotesBySimilarity(query, notes, ctx);

  let result: SkillContextNoteItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 notes
  for (const note of sortedNotes) {
    const noteTokens = countToken(note?.note?.content || '');

    if (noteTokens > MAX_NEED_RECALL_TOKEN) {
      // 1.1 大内容，直接走召回
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entityId: note?.note?.noteId,
          title: note?.note?.title,
          entityType: 'note',
          domain: 'note',
        },
        MAX_NEED_RECALL_TOKEN,
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
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entityId: remainingNote?.note?.noteId,
          title: remainingNote?.note?.title,
          entityType: 'note',
          domain: 'note',
        },
        remainingTokens,
        ctx,
      );
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

  // 1. 计算相似度并排序
  const sortedResources = await sortResourcesBySimilarity(query, resources, ctx);

  let result: SkillContextResourceItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 resources
  for (const resource of sortedResources) {
    const resourceTokens = countToken(resource?.resource?.content || '');

    if (resourceTokens > MAX_NEED_RECALL_TOKEN) {
      // 2.1 大内容，直接走召回
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entityId: resource?.resource?.resourceId,
          title: resource?.resource?.title,
          entityType: 'resource',
          domain: 'resource',
        },
        MAX_NEED_RECALL_TOKEN,
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
      const relevantChunks = await knowledgeBaseSearchGetRelevantChunks(
        query,
        {
          entityId: remainingResource?.resource?.resourceId,
          title: remainingResource?.resource?.title,
          entityType: 'resource',
          domain: 'resource',
        },
        remainingTokens,
        ctx,
      );
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

export async function knowledgeBaseSearchGetRelevantChunks(
  query: string,
  metadata: { entityId: string; title: string; entityType: EntityType; domain: SearchDomain },
  maxTokens: number,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<DocumentInterface[]> {
  // 1. search relevant chunks
  const res = await ctx.ctxThis.engine.service.search(
    ctx.configSnapshot.user,
    {
      query,
      entities: [
        {
          entityId: metadata.entityId,
          entityType: metadata.entityType,
        },
      ],
      mode: 'vector',
      limit: 10,
      domains: [metadata.domain],
    },
    { enableReranker: true },
  );
  const relevantChunks = res?.data?.map((item) => ({
    id: item.id,
    pageContent: item?.content?.[0] || '',
    metadata: {
      ...item.metadata,
      title: item.title,
    },
  }));

  // 2. 选择最相关的 chunks，直到达到 maxTokens 限制
  let result: DocumentInterface[] = [];
  let usedTokens = 0;

  for (const chunk of relevantChunks) {
    const chunkTokens = countToken(chunk?.pageContent || '');
    if (usedTokens + chunkTokens <= maxTokens) {
      result.push(chunk as DocumentInterface);
      usedTokens += chunkTokens;
    } else {
      break;
    }
  }

  return result;
}

export async function inMemoryGetRelevantChunks(
  query: string,
  content: string,
  metadata: { entityId: string; title: string; entityType: ContentNodeType },
  maxTokens: number,
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
  const relevantChunks = res?.data;

  // 2. 选择最相关的 chunks，直到达到 maxTokens 限制
  let result: DocumentInterface[] = [];
  let usedTokens = 0;

  for (const chunk of relevantChunks) {
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
