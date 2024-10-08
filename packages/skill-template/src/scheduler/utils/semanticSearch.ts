import {
  Icon,
  Resource,
  Note,
  Collection,
  SkillInvocationConfig,
  SkillMeta,
  SkillTemplateConfigSchema,
  SkillContextContentItem,
  SkillContextResourceItem,
  SkillContextNoteItem,
  SkillContextCollectionItem,
} from '@refly/openapi-schema';
import { Chunk, IContext } from '../types';
import { countToken, ModelContextLimitMap } from './token';
import { MAX_NEED_RECALL_TOKEN, SHORT_CONTENT_THRESHOLD, MIN_RELEVANCE_SCORE } from './constants';
import { calculateEmbedding, cosineSimilarity } from './embedding';
import { getRelevantChunks } from './chunking';

// TODO:替换成实际的 Chunk 定义，然后进行拼接，拼接时包含元数据和分隔符
export function assembleChunks(chunks: Chunk[]): string {
  // 按照原始位置排序 chunks
  chunks.sort((a, b) => a.metadata.start - b.metadata.start);

  // 组装 chunks 为一个字符串，可能需要添加一些标记来指示不连续的部分
  return chunks.map((chunk) => chunk.content).join(' [...] ');
}

export async function sortContentBySimilarity(
  query: string,
  contentList: SkillContextContentItem[],
): Promise<SkillContextContentItem[]> {
  // 1. 计算查询的嵌入向量
  const queryEmbedding = await calculateEmbedding(query);

  // 2. 计算每个内容项的嵌入向量和相似度
  const contentWithSimilarity = await Promise.all(
    contentList.map(async (content) => {
      const contentEmbedding = await calculateEmbedding(content.content);
      const similarity = cosineSimilarity(queryEmbedding, contentEmbedding);
      return { content, similarity };
    }),
  );

  // 3. 根据相似度排序
  contentWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  // 4. 返回排序后的内容列表
  return contentWithSimilarity.map((item) => item.content);
}

export async function sortNotesBySimilarity(
  query: string,
  notes: SkillContextNoteItem[],
): Promise<SkillContextNoteItem[]> {
  // 1. 计算查询的嵌入向量
  const queryEmbedding = await calculateEmbedding(query);

  // 2. 计算每个笔记的嵌入向量和相似度
  const notesWithSimilarity = await Promise.all(
    notes.map(async (note) => {
      const noteEmbedding = await calculateEmbedding(note.note?.content || '');
      const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
      return { note, similarity };
    }),
  );

  // 3. 根据相似度排序
  notesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  // 4. 返回排序后的笔记列表
  return notesWithSimilarity.map((item) => item.note);
}

export async function sortResourcesBySimilarity(
  query: string,
  resources: SkillContextResourceItem[],
): Promise<SkillContextResourceItem[]> {
  // 1. 计算查询的嵌入向量
  const queryEmbedding = await calculateEmbedding(query);

  // 2. 计算每个资源的嵌入向量和相似度
  const resourcesWithSimilarity = await Promise.all(
    resources.map(async (resource) => {
      const resourceEmbedding = await calculateEmbedding(resource.resource?.content || '');
      const similarity = cosineSimilarity(queryEmbedding, resourceEmbedding);
      return { resource, similarity };
    }),
  );

  // 3. 根据相似度排序
  resourcesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  // 4. 返回排序后的资源列表
  return resourcesWithSimilarity.map((item) => item.resource);
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
): Promise<SkillContextContentItem[]> {
  const MAX_RAG_RELEVANT_CONTENT_RATIO = 0.7;
  const MAX_SHORT_CONTENT_RATIO = 0.3;

  const MAX_RAG_RELEVANT_CONTENT_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_CONTENT_RATIO);
  const MAX_SHORT_CONTENT_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_CONTENT_RATIO);

  // 1. 计算相似度并排序
  const sortedContent = await sortContentBySimilarity(query, contentList);

  let result: SkillContextContentItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 content
  for (const content of sortedContent) {
    const contentTokens = countToken(content.content);

    if (contentTokens > MAX_NEED_RECALL_TOKEN) {
      // 2.1 大内容，直接走召回
      const relevantChunks = await getRelevantChunks(query, content.content, MAX_NEED_RECALL_TOKEN);
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
      const relevantChunks = await getRelevantChunks(query, remainingContent.content, remainingTokens);
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
): Promise<SkillContextNoteItem[]> {
  const MAX_RAG_RELEVANT_NOTES_RATIO = 0.7;
  const MAX_SHORT_NOTES_RATIO = 0.3;

  const MAX_RAG_RELEVANT_NOTES_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_NOTES_RATIO);
  const MAX_SHORT_NOTES_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_NOTES_RATIO);

  // 1. 计算相似度并排序
  const sortedNotes = await sortNotesBySimilarity(query, notes);

  let result: SkillContextNoteItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 notes
  for (const note of sortedNotes) {
    const noteTokens = countToken(note?.note?.content || '');

    if (noteTokens > MAX_NEED_RECALL_TOKEN) {
      // 1.1 大内容，直接走召回
      const relevantChunks = await getRelevantChunks(query, note?.note?.content || '', MAX_NEED_RECALL_TOKEN);
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
      const relevantChunks = await getRelevantChunks(query, remainingNote?.note?.content || '', remainingTokens);
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
): Promise<SkillContextResourceItem[]> {
  const MAX_RAG_RELEVANT_RESOURCES_RATIO = 0.7;
  const MAX_SHORT_RESOURCES_RATIO = 0.3;

  const MAX_RAG_RELEVANT_RESOURCES_MAX_TOKENS = Math.floor(maxTokens * MAX_RAG_RELEVANT_RESOURCES_RATIO);
  const MAX_SHORT_RESOURCES_MAX_TOKENS = Math.floor(maxTokens * MAX_SHORT_RESOURCES_RATIO);

  // 1. 计算相似度并排序
  const sortedResources = await sortResourcesBySimilarity(query, resources);

  let result: SkillContextResourceItem[] = [];
  let usedTokens = 0;

  // 2. 按相关度顺序处理 resources
  for (const resource of sortedResources) {
    const resourceTokens = countToken(resource?.resource?.content || '');

    if (resourceTokens > MAX_NEED_RECALL_TOKEN) {
      // 2.1 大内容，直接走召回
      const relevantChunks = await getRelevantChunks(query, resource?.resource?.content || '', MAX_NEED_RECALL_TOKEN);
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
      const relevantChunks = await getRelevantChunks(
        query,
        remainingResource?.resource?.content || '',
        remainingTokens,
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
  );

  // 处理 resources
  const processedResources = await processResourcesWithSimilarity(
    query,
    mentionedContext.resources,
    MAX_RESOURCE_RAG_RELEVANT_MAX_TOKENS,
  );

  // 处理 notes
  const processedNotes = await processNotesWithSimilarity(
    query,
    mentionedContext.notes,
    MAX_NOTE_RAG_RELEVANT_MAX_TOKENS,
  );

  // 返回处理后的上下文
  return {
    ...mentionedContext,
    contentList: processedContentList,
    resources: processedResources,
    notes: processedNotes,
  };
}
