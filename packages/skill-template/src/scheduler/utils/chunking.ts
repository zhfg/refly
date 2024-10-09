import { countToken } from './token';
import { BaseSkill, SkillRunnableConfig } from '@/base';
import { Chunk, IContext, GraphState, SelectedContentDomain } from '../types';
import { ContentNodeType, NodeMeta } from '../../engine';
import { Document, DocumentInterface } from '@langchain/core/documents';
import { MIN_RELEVANCE_SCORE } from './constants';
import { genUniqueId } from '@refly/utils';

// TODO: concern start index and endIndex for concat, optimize rag service's splitText
export async function getRelevantChunks(
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
