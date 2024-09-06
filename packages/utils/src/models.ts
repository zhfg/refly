import { ModelTier, TokenUsageItem } from '@refly/openapi-schema';

export type AvailableModel =
  | 'gpt-4o-2024-08-06'
  | 'claude-3-5-sonnet'
  | 'gemini-1.5-pro'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo'
  | 'gemini-1.5-flash';

const modelTierMap: Record<AvailableModel, ModelTier> = {
  'gpt-4o-2024-08-06': 't1',
  'claude-3-5-sonnet': 't1',
  'gemini-1.5-pro': 't1',
  'gpt-4o-mini': 't2',
  'gpt-3.5-turbo': 't2',
  'gemini-1.5-flash': 't2',
};

export const getModelTier = (modelName: string) => {
  return modelTierMap[modelName];
};

/**
 * Aggregate token usage items by model tier and name
 */
export const aggregateTokenUsage = (usageItems: TokenUsageItem[]): TokenUsageItem[] => {
  let aggregatedUsage: Record<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      modelProvider: string;
    }
  > = {};

  usageItems.forEach((item) => {
    const key = `${item.tier}:${item.modelName}`;
    if (!aggregatedUsage[key]) {
      aggregatedUsage[key] = { inputTokens: 0, outputTokens: 0, modelProvider: item.modelProvider };
    }
    aggregatedUsage[key].inputTokens += item.inputTokens;
    aggregatedUsage[key].outputTokens += item.outputTokens;
  });

  return Object.entries(aggregatedUsage)
    .map(([key, value]) => {
      const [tier, modelName] = key.split(':');
      return {
        tier,
        modelName,
        modelProvider: value.modelProvider,
        inputTokens: value.inputTokens,
        outputTokens: value.outputTokens,
      };
    })
    .sort((a, b) => {
      if (a.tier === b.tier) {
        return a.modelName.localeCompare(b.modelName);
      }
      return a.tier.localeCompare(b.tier);
    });
};
