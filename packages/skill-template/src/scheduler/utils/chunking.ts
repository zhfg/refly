import { Chunk } from '../types';
import { calculateEmbedding, cosineSimilarity } from './embedding';
import { countToken } from './token';
import { MIN_RELEVANCE_SCORE } from './constants';

export async function getRelevantChunks(query: string, content: string, maxTokens: number): Promise<Chunk[]> {
  // 1. 将内容分割成多个 chunks
  const chunks = splitContentIntoChunks(content);

  // 2. 计算查询的嵌入向量
  const queryEmbedding = await calculateEmbedding(query);

  // 3. 计算每个 chunk 与查询的相似度
  const chunksWithSimilarity = await Promise.all(
    chunks.map(async (chunk) => {
      const chunkEmbedding = await calculateEmbedding(chunk.content);
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { ...chunk, similarity };
    }),
  );

  // 4. 过滤掉相关性低于 MIN_RELEVANCE_SCORE 的 Chunks
  const relevantChunks = chunksWithSimilarity.filter((chunk) => chunk.similarity >= MIN_RELEVANCE_SCORE);

  // 5. 按相似度排序
  relevantChunks.sort((a, b) => b.similarity - a.similarity);

  // 6. 选择最相关的 chunks，直到达到 maxTokens 限制
  let result: Chunk[] = [];
  let usedTokens = 0;

  for (const chunk of relevantChunks) {
    const chunkTokens = countToken(chunk.content);
    if (usedTokens + chunkTokens <= maxTokens) {
      result.push(chunk);
      usedTokens += chunkTokens;
    } else {
      break;
    }
  }

  return result;
}

export function splitContentIntoChunks(content: string): Chunk[] {
  // 实现内容分割逻辑
  // 这里使用一个简单的按句子分割的方法，您可能需要根据实际需求调整
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  let startIndex = 0;
  return sentences.map((sentence) => {
    const chunk: Chunk = {
      content: sentence.trim(),
      metadata: {
        start: startIndex,
        end: startIndex + sentence.length,
      },
    };
    startIndex += sentence.length;
    return chunk;
  });
}
