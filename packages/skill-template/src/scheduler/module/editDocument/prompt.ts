import { Document } from '@refly-packages/openapi-schema';
import { HighlightSelection } from './types';
import { InPlaceEditType } from '@refly-packages/utils';
import {
  buildBlockEditDocumentSystemPrompt,
  buildBlockEditDocumentUserPrompt,
  buildContextualBlockEditDocumentContextUserPrompt,
} from './block';
import {
  buildInlineEditDocumentSystemPrompt,
  buildInlineEditDocumentUserPrompt,
  buildContextualInlineEditDocumentContextUserPrompt,
} from './inline';

interface EditDocumentModule {
  buildSystemPrompt: (locale: string, needPrepareContext: boolean) => string;
  buildUserPrompt: (params: { originalQuery: string; rewrittenQuery: string }) => string;
  buildContextUserPrompt: (documentContext: {
    document: Document;
    selectedContent: HighlightSelection;
  }) => (context: string, needPrepareContext: boolean) => string;
}

const getModules = (documentContext: {
  document: Document;
  selectedContent: HighlightSelection;
}) => {
  return {
    block: {
      buildSystemPrompt: buildBlockEditDocumentSystemPrompt,
      buildUserPrompt: buildBlockEditDocumentUserPrompt,
      buildContextUserPrompt: buildContextualBlockEditDocumentContextUserPrompt(documentContext),
    },
    inline: {
      buildSystemPrompt: buildInlineEditDocumentSystemPrompt,
      buildUserPrompt: buildInlineEditDocumentUserPrompt,
      buildContextUserPrompt: buildContextualInlineEditDocumentContextUserPrompt(documentContext),
    },
  };
};

export const getEditDocumentModule = (
  type: InPlaceEditType,
  documentContext: {
    document: Document;
    selectedContent: HighlightSelection;
  },
) => {
  return getModules(documentContext)[type];
};

// Re-export types and helpers
export * from './types';
export * from './helper';
