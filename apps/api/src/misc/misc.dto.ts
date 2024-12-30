import { ModelInfo, ModelTier } from '@refly-packages/openapi-schema';
import { ModelInfo as ModelInfoPO } from '@prisma/client';
import { pick } from '@refly-packages/utils';

export function modelInfoPO2DTO(modelInfo: ModelInfoPO): ModelInfo {
  return {
    ...pick(modelInfo, ['name', 'label', 'provider', 'contextLimit', 'maxOutput']),
    tier: modelInfo.tier as ModelTier,
    capabilities: JSON.parse(modelInfo.capabilities),
  };
}
