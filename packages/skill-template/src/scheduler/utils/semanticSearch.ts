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
import { MAX_NEED_RECALL_TOKEN, SHORT_CONTENT_THRESHOLD } from './constants';

export function assembleChunks(chunks: Chunk[]): string {
  // 按照原始位置排序 chunks
  chunks.sort((a, b) => a.metadata.start - b.metadata.start);

  // 组装 chunks 为一个字符串，可能需要添加一些标记来指示不连续的部分
  return chunks.map((chunk) => chunk.content).join(' [...] ');
}

export async function sortNotesBySimilarity(
  query: string,
  notes: SkillContextNoteItem[],
): Promise<SkillContextNoteItem[]> {
  // 实现相似度计算和排序逻辑
  // 这里可以使用向量数据库或其他相似度计算方法
  // 返回按相似度排序的 notes
}

export async function getRelevantChunk(query: string, content: string, maxTokens: number): Promise<string> {
  // 实现获取相关内容片段的逻辑
  // 可以使用滑动窗口或其他文本分割方法，然后计算相似度
  // 返回最相关的内容片段，确保不超过 maxTokens
}

export const processSelectedContentWithSimilarity = async (
  query: string,
  contentList: SkillContextContentItem[],
  maxTokens: number,
) => {
  return [];
};

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
  const sortedNotes = await this.sortNotesBySimilarity(query, notes);

  let result: SkillContextNoteItem[] = [];
  let usedTokens = 0;
  let shortNotesQueue: SkillContextNoteItem[] = [];

  // 2. 迭代处理 notes
  for (const note of sortedNotes) {
    const noteTokens = countToken(note.note.content);

    if (noteTokens > MAX_NEED_RECALL_TOKEN) {
      // 2.1 大内容，使用相似度匹配获取片段
      const relevantChunk = await this.getRelevantChunk(query, note.note.content, MAX_NEED_RECALL_TOKEN);
      result.push({ ...note, note: { ...note.note, content: relevantChunk } });
      usedTokens += countToken(relevantChunk);
    } else if (usedTokens + noteTokens <= MAX_RAG_RELEVANT_NOTES_MAX_TOKENS) {
      // 2.2 小内容，直接添加
      result.push(note);
      usedTokens += noteTokens;
    } else if (noteTokens < SHORT_CONTENT_THRESHOLD) {
      // 2.3 短内容，加入队列
      shortNotesQueue.push(note);
    } else {
      // 2.4 剩余内容，使用相似度匹配获取片段
      const relevantChunk = await this.getRelevantChunk(query, note.note.content, MAX_NEED_RECALL_TOKEN);
      result.push({ ...note, note: { ...note.note, content: relevantChunk } });
      usedTokens += countToken(relevantChunk);
    }

    if (usedTokens >= MAX_RAG_RELEVANT_NOTES_MAX_TOKENS) break;
  }

  // 处理短内容队列
  while (shortNotesQueue.length > 0 && usedTokens < maxTokens) {
    const shortNote = shortNotesQueue.shift()!;
    const shortNoteTokens = countToken(shortNote?.note?.content || '');
    if (usedTokens + shortNoteTokens <= maxTokens) {
      result.push(shortNote);
      usedTokens += shortNoteTokens;
    } else {
      break;
    }
  }

  // 处理剩余的 notes
  while (usedTokens < maxTokens && sortedNotes.length > result.length) {
    const remainingNote = sortedNotes[result.length];
    const relevantChunk = await this.getRelevantChunk(query, remainingNote.note.content, maxTokens - usedTokens);
    result.push({ ...remainingNote, note: { ...remainingNote.note, content: relevantChunk } });
    usedTokens += countToken(relevantChunk);
  }

  return result;
}

export const processResourcesWithSimilarity = async (
  query: string,
  resources: SkillContextResourceItem[],
  maxTokens: number,
) => {
  return [];
};

export async function prepareRelevantContext(query: string): Promise<string> {
  const {
    locale = 'en',
    chatHistory = [],
    modelName,
    contentList,
    resources,
    notes,
    collections,
  } = this.configSnapshot.configurable;

  // configurable params
  const MAX_CONTEXT_RATIO = 0.7;
  const MAX_SELECTED_CONTENT_RATIO = 2 / 4;
  const MAX_NOTES_RATIO = 1 / 4;
  const MAX_RESOURCES_RATIO = 1 / 4;
  let remainingTokens = 0;

  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  // all tokens
  const modelWindowSize = ModelContextLimitMap[modelName];
  const maxContextTokens = Math.floor(modelWindowSize * MAX_CONTEXT_RATIO);
  const allSelectedContentTokens = contentList.reduce((sum, content) => sum + countToken(content?.content || ''), 0);
  const allNotesTokens = notes.reduce((sum, note) => sum + countToken(note?.note?.content), 0);
  const allResourcesTokens = resources.reduce((sum, resource) => sum + countToken(resource.resource?.content), 0);

  // TODO: 1. web search context
  const webSearchContextTokens = 0;
  remainingTokens = maxContextTokens - webSearchContextTokens;

  // TODO: 2. entity extract context: include rich text editor rules entity and LLM infer entity
  const entityExtractContextTokens = 0;
  remainingTokens = remainingTokens - entityExtractContextTokens;

  // 3. selected content context
  let selectedContentTokens = allSelectedContentTokens;
  const selectedContentMaxTokens =
    maxContextTokens - allNotesTokens - allResourcesTokens > MAX_SELECTED_CONTENT_RATIO * maxContextTokens
      ? maxContextTokens - allNotesTokens - allResourcesTokens
      : MAX_SELECTED_CONTENT_RATIO * maxContextTokens;
  if (selectedContentTokens > selectedContentMaxTokens) {
    const relevantContentList = await this.processSelectedContentWithSimilarity(
      query,
      contentList,
      selectedContentMaxTokens,
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
    maxContextTokens - selectedContentTokens - allResourcesTokens > MAX_NOTES_RATIO * maxContextTokens
      ? maxContextTokens - selectedContentTokens - allResourcesTokens
      : MAX_NOTES_RATIO * maxContextTokens;
  if (notesTokens > notesMaxTokens) {
    const relevantNotes = await this.processNotesWithSimilarity(query, notes, notesMaxTokens);
    relevantContexts.notes.concat(...relevantNotes);
    notesTokens = relevantNotes.reduce((sum, note) => sum + countToken(note?.note?.content), 0);
  } else {
    relevantContexts.notes.concat(...notes);
  }

  // 5. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  let resourcesTokens = allResourcesTokens;
  const resourcesMaxTokens =
    maxContextTokens - selectedContentTokens - notesTokens > MAX_RESOURCES_RATIO * maxContextTokens
      ? maxContextTokens - selectedContentTokens - notesTokens
      : MAX_RESOURCES_RATIO * maxContextTokens;
  if (resourcesTokens > resourcesMaxTokens) {
    const relevantResources = await this.processResourcesWithSimilarity(query, resources, resourcesMaxTokens);
    relevantContexts.resources.concat(...relevantResources);
    resourcesTokens = relevantResources.reduce((sum, resource) => sum + countToken(resource?.resource?.content), 0);
  } else {
    relevantContexts.resources.concat(...resources);
  }

  const context = this.concatContext(relevantContexts);

  return context;
}
