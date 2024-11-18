import { CanvasIntentType } from '@refly-packages/common-types';
import { Document } from '@refly-packages/openapi-schema';
import { CanvasEditConfig } from '@refly-packages/utils';

// Helper function to determine allowed intent types
export const prepareIntentMatcherTypeDomain = (
  currentDocument?: Document,
  canvasEditConfig?: CanvasEditConfig,
  projectId?: string,
) => {
  if (projectId && currentDocument && canvasEditConfig) {
    return [CanvasIntentType.EditDocument];
  }

  if (projectId && currentDocument && !canvasEditConfig) {
    return [CanvasIntentType.RewriteDocument, CanvasIntentType.GenerateDocument, CanvasIntentType.Other];
  }

  return [CanvasIntentType.GenerateDocument, CanvasIntentType.Other];
};

export const allIntentMatcherTypeDomain = [
  CanvasIntentType.EditDocument,
  CanvasIntentType.RewriteDocument,
  CanvasIntentType.GenerateDocument,
  CanvasIntentType.Other,
];
