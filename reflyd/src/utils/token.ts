import { get_encoding } from '@dqbd/tiktoken';

export const LLMTypeGPT35Turbo = 'gpt-3.5-turbo';
export const LLMTypeGPT35Turbo16K = 'gpt-3.5-turbo-16k';
export const LLMTypeGPT4 = 'gpt-4';
export const LLMTypeGPT432K = 'gpt-4-32k';
export const LLMTypeGPT4Turbo = 'gpt-4-turbo';
export const enum LLMModelType {
  LLMTypeGPT35Turbo = 'gpt-3.5-turbo',
  LLMTypeGPT35Turbo16K = 'gpt-3.5-turbo-16k',
  LLMTypeGPT4 = 'gpt-4',
  LLMTypeGPT432K = 'gpt-4-32k',
  LLMTypeGPT4Turbo = 'gpt-4-turbo',
}

const enc_p50k_base = get_encoding('p50k_base');
const enc_cl100k_base = get_encoding('cl100k_base');
// openai embedding limit 8191
const EmbeddingTokensLimit = 1000;

// https://github.com/niieani/gpt-tokenizer
type TokenizerType =
  | 'chat'
  | 'text-only'
  | 'code'
  | 'edit'
  | 'embeddings'
  | 'turbo'
  | 'gpt3'
  | 'codex';

export const countToken = (text: string) => {
  return enc_cl100k_base.encode(text).length;
};

export const generalCountToken = (
  text: string,
  model: TokenizerType = 'turbo',
) => {
  if (model === 'turbo') {
    return enc_cl100k_base.encode(text).length;
  }
  return enc_p50k_base.encode(text).length;
};

export const modelTokenConfig: Record<string, [TokenizerType, number]> = {
  [LLMTypeGPT35Turbo16K]: ['turbo', 16 * 1024],
  [LLMTypeGPT35Turbo]: ['turbo', 4 * 1024],
  [LLMTypeGPT432K]: ['turbo', 32 * 1024],
  [LLMTypeGPT4]: ['turbo', 8 * 1024],
  [LLMTypeGPT4Turbo]: ['turbo', 128 * 1024],
};

export const isTokenOverflow = (
  content: string | number,
  model: string,
  reservation = 1024,
) => {
  const limit = modelTokenConfig[model]; // 这里model指 LLMType
  const count = typeof content === 'string' ? countToken(content) : content;
  return count + reservation > limit?.[1] ?? 8 * 1024;
};

export const isTokenOverflowUsingModel = (
  content: string,
  contextLimit: number,
  reservation = 1024,
) => {
  return countToken(content) + reservation > contextLimit;
};

export const chunkSize = 1000;
export const maxWebsiteTokenSize = 6000;
export const chunkOverlap = 200;

export function truncateToken(
  text: string,
  maxTokenLimit: number,
  chunkSize = 1000,
) {
  let resultStr = '';

  if (countToken(text) < maxTokenLimit) return text;

  for (let i = 0; i < text.length; i++) {
    const start = chunkSize * i;
    const end = Math.min(chunkSize * (i + 1), text.length);

    if (countToken(resultStr + text.slice(start, end)) < maxTokenLimit) {
      resultStr += text.slice(start, end);
    } else {
      //
      const remainingTokens = maxTokenLimit - countToken(resultStr);

      resultStr += text.slice(start, start + remainingTokens);
      break;
    }
  }

  return resultStr;
}

// TODO： 目前比较粗暴，直接截断，理论上后续总结场景需要关注所有的 header 以及首段的总结，这样能够得到更加全面的总结
export function getExpectedTokenLenContent(
  texts: string[] | string = [],
  tokenLimit = 0,
) {
  try {
    let newTexts;

    if (Array.isArray(texts)) {
      const totalText = texts?.reduce((total, curr) => total + curr, '');
      if (totalText.length < tokenLimit) return texts;

      newTexts = texts.map((text) => text.slice(0, tokenLimit));
    } else {
      if (texts.length < tokenLimit) return texts;

      newTexts = texts.slice(0, tokenLimit);
    }

    return newTexts;
  } catch (err) {
    return texts;
  }
}
