import { CanvasIntentType } from '@refly-packages/common-types';

// Helper function to determine allowed intent types
export const prepareIntentMatcherTypeDomain = (currentCanvas?: any, projectId?: string) => {
  if (!currentCanvas || !projectId) {
    return [CanvasIntentType.GenerateCanvas, CanvasIntentType.Other];
  }

  if (projectId && currentCanvas) {
    return [
      CanvasIntentType.RewriteCanvas,
      CanvasIntentType.UpdateCanvas,
      CanvasIntentType.GenerateCanvas,
      CanvasIntentType.Other,
    ];
  }

  return [CanvasIntentType.Other];
};
