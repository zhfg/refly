import { ModelInfo, TokenUsageItem } from '@refly-packages/openapi-schema';

export const defaultModelList: ModelInfo[] = [
  {
    name: 'openai/gpt-4o-2024-08-06',
    label: 'GPT-4o',
    provider: 'openai',
    tier: 't1',
  },
  {
    name: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 't1',
  },
  {
    name: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'openai',
    tier: 't2',
  },
  {
    name: 'anthropic/claude-3-haiku',
    label: 'Claude 3 Haiku',
    provider: 'anthropic',
    tier: 't2',
  },
];

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
