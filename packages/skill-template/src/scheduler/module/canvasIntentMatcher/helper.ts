import { DocumentIntentType } from '@refly-packages/common-types';
import { Document } from '@refly-packages/openapi-schema';
import { CanvasEditConfig } from '@refly-packages/utils';

// Helper function to determine allowed intent types
export const prepareIntentMatcherTypeDomain = (
  currentDocument?: Document,
  canvasEditConfig?: CanvasEditConfig,
  projectId?: string,
) => {
  if (projectId && currentDocument && canvasEditConfig) {
    return [DocumentIntentType.EditDocument];
  }

  if (projectId && currentDocument && !canvasEditConfig) {
    return [DocumentIntentType.RewriteDocument, DocumentIntentType.GenerateDocument, DocumentIntentType.Other];
  }

  return [DocumentIntentType.GenerateDocument, DocumentIntentType.Other];
};

export const allIntentMatcherTypeDomain = [
  DocumentIntentType.EditDocument,
  DocumentIntentType.RewriteDocument,
  DocumentIntentType.GenerateDocument,
  DocumentIntentType.Other,
];
