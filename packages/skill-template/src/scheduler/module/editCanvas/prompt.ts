import { Canvas } from '@refly-packages/openapi-schema';
import { HighlightSelection } from './types';
import { InPlaceEditType } from '@refly-packages/utils';
import {
  buildBlockEditCanvasSystemPrompt,
  buildBlockEditCanvasUserPrompt,
  buildContextualBlockEditCanvasContextUserPrompt,
} from './blockPrompt';
import {
  buildInlineEditCanvasSystemPrompt,
  buildInlineEditCanvasUserPrompt,
  buildContextualInlineEditCanvasContextUserPrompt,
} from './inlinePrompt';

interface EditCanvasModule {
  buildSystemPrompt: (locale: string, needPrepareContext: boolean) => string;
  buildUserPrompt: (params: { originalQuery: string; rewrittenQuery: string }) => string;
  buildContextUserPrompt: (documentContext: {
    canvas: Canvas;
    selectedContent: HighlightSelection;
  }) => (context: string, needPrepareContext: boolean) => string;
}

const getModules = (documentContext: { canvas: Canvas; selectedContent: HighlightSelection }) => {
  return {
    block: {
      buildSystemPrompt: buildBlockEditCanvasSystemPrompt,
      buildUserPrompt: buildBlockEditCanvasUserPrompt,
      buildContextUserPrompt: buildContextualBlockEditCanvasContextUserPrompt(documentContext),
    },
    inline: {
      buildSystemPrompt: buildInlineEditCanvasSystemPrompt,
      buildUserPrompt: buildInlineEditCanvasUserPrompt,
      buildContextUserPrompt: buildContextualInlineEditCanvasContextUserPrompt(documentContext),
    },
  };
};

export const getEditCanvasModule = (
  type: InPlaceEditType,
  documentContext: {
    canvas: Canvas;
    selectedContent: HighlightSelection;
  },
) => {
  return getModules(documentContext)[type];
};

// Re-export types and helpers
export * from './types';
export * from './helper';
