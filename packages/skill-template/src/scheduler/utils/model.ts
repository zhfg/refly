import { ModelInfo } from '@refly-packages/openapi-schema';

const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google'];

export const checkIsSupportedModel = (modelInfo: ModelInfo) => {
  return SUPPORTED_PROVIDERS.includes(modelInfo.provider);
};

export const checkModelContextLenSupport = (modelInfo: ModelInfo) => {
  return modelInfo?.contextLimit > 8 * 1024;
};
