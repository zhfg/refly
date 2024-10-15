import { IContext } from '../types';
import { get_encoding } from '@dqbd/tiktoken';
import { BaseMessage } from '@langchain/core/messages';
import {
  SkillContextCollectionItem,
  SkillContextContentItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
  Source,
} from '@refly-packages/openapi-schema';

export enum LLMType {
  GPT4oMini = 'openai/gpt-4o-mini',
  GPT4o = 'openai/gpt-4o-2024-08-06',
  Claude35Sonnet = 'anthropic/claude-3.5-sonnet',
  Claude3Haiku = 'anthropic/claude-3-haiku',
  GeminiFlash15 = 'google/gemini-flash-1.5',
  GeminiPro15 = 'google/gemini-pro-1.5',
}

export const ModelContextLimitMap = {
  [LLMType.GPT4oMini]: 128 * 1024,
  [LLMType.GPT4o]: 128 * 1024,
  [LLMType.Claude35Sonnet]: 200 * 1024,
  [LLMType.Claude3Haiku]: 200 * 1024,
  [LLMType.GeminiFlash15]: 4 * 1024 * 1024,
  [LLMType.GeminiPro15]: 4 * 1024 * 1024,
};

// const enc_p50k_base = get_encoding('p50k_base');
const enc_cl100k_base = get_encoding('cl100k_base');
// openai embedding limit 8191
// const EmbeddingTokensLimit = 1000;

// https://github.com/niieani/gpt-tokenizer
// type TokenizerType = 'chat' | 'text-only' | 'code' | 'edit' | 'embeddings' | 'turbo' | 'gpt3' | 'codex';

export const countToken = (text: string) => {
  return enc_cl100k_base.encode(text).length;
};

export const isTokenOverflow = (content: string, model: string, reservation = 1024) => {
  const limit = ModelContextLimitMap[model]; // 这里model指 LLMType
  const count = countToken(content);
  return count + reservation > limit ?? 8 * 1024;
};

export const countContentTokens = (contentList: SkillContextContentItem[] = []) => {
  return contentList.reduce((sum, content) => sum + countToken(content?.content || ''), 0);
};

export const countResourceTokens = (resources: SkillContextResourceItem[] = []) => {
  return resources.reduce((sum, resource) => sum + countToken(resource?.resource?.content), 0);
};

export const countNoteTokens = (notes: SkillContextNoteItem[] = []) => {
  return notes.reduce((sum, note) => sum + countToken(note?.note?.content), 0);
};

export const countWebSearchContextTokens = (webSearchSources: Source[] = []) => {
  return webSearchSources.reduce((sum, source) => sum + countToken(source?.pageContent), 0);
};

// TODO: collections 搜索和在整个知识库搜索一起实现
// export const countCollectionTokens = (collections: SkillContextCollectionItem[]) => {
//   return collections.reduce((sum, collection) => sum + countToken(collection?.collection?.content), 0);
// };

export const countContextTokens = (mentionedContext: IContext) => {
  return (
    countContentTokens(mentionedContext?.contentList) +
    countResourceTokens(mentionedContext?.resources) +
    countNoteTokens(mentionedContext?.notes)
  );
};

export const checkHasContext = (mentionedContext: IContext) => {
  return (
    mentionedContext?.contentList?.length > 0 ||
    mentionedContext?.resources?.length > 0 ||
    mentionedContext?.notes?.length > 0
  );
};

export const countMessagesTokens = (messages: BaseMessage[] = []) => {
  return messages.reduce((sum, message) => sum + countToken(message.content as string), 0);
};
