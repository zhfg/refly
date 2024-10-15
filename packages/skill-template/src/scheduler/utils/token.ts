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
import { ModelContextLimitMap, LLMType } from '@refly-packages/utils';

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
    mentionedContext?.notes?.length > 0 ||
    mentionedContext?.collections?.length > 0
  );
};

export const countMessagesTokens = (messages: BaseMessage[] = []) => {
  return messages.reduce((sum, message) => sum + countToken(message.content as string), 0);
};

export { ModelContextLimitMap, LLMType };
