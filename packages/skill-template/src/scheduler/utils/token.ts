import { get_encoding } from '@dqbd/tiktoken';

export enum LLMType {
  GPT4oMini = 'gpt-4o-mini',
  GPT4o = 'gpt-4o-turbo',
  Claude35Sonnet = 'claude-3-5-sonnet',
  Claude3Haiku = 'claude-3-haiku',
  GeminiFlash15 = 'gemini-flash-1.5',
  GeminiPro15 = 'gemini-pro-1.5',
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
