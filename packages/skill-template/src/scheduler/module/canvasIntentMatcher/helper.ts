import { CanvasIntentType } from '@refly-packages/common-types';
import { Canvas } from '@refly-packages/openapi-schema';
import { CanvasEditConfig } from '@refly-packages/utils';

// Helper function to determine allowed intent types
export const prepareIntentMatcherTypeDomain = (
  currentCanvas?: Canvas,
  canvasEditConfig?: CanvasEditConfig,
  projectId?: string,
) => {
  if (projectId && currentCanvas && canvasEditConfig) {
    return [CanvasIntentType.EditCanvas];
  }

  if (projectId && currentCanvas && !canvasEditConfig) {
    return [CanvasIntentType.RewriteCanvas, CanvasIntentType.GenerateCanvas, CanvasIntentType.Other];
  }

  return [CanvasIntentType.GenerateCanvas, CanvasIntentType.Other];
};

export const allIntentMatcherTypeDomain = [
  CanvasIntentType.EditCanvas,
  CanvasIntentType.RewriteCanvas,
  CanvasIntentType.GenerateCanvas,
  CanvasIntentType.Other,
];
