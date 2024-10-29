import { Canvas } from '@refly-packages/openapi-schema';
import { HighlightSelection } from './types';
import { InPlaceEditType } from '@refly-packages/utils';
import { blockEditCanvasSystemPrompt, blockEditCanvasUserPrompt, blockEditCanvasContext } from './blockPrompt';
import { inlineEditCanvasSystemPrompt, inlineEditCanvasUserPrompt, inlineEditCanvasContext } from './inlinePrompt';

export interface EditCanvasPrompts {
  systemPrompt: string;
  userPrompt: (query: string, selection: HighlightSelection) => string;
  contextPrompt: (canvas: Canvas, selection: HighlightSelection) => string;
}

const prompts: Record<InPlaceEditType, EditCanvasPrompts> = {
  block: {
    systemPrompt: blockEditCanvasSystemPrompt,
    userPrompt: blockEditCanvasUserPrompt,
    contextPrompt: blockEditCanvasContext,
  },
  inline: {
    systemPrompt: inlineEditCanvasSystemPrompt,
    userPrompt: inlineEditCanvasUserPrompt,
    contextPrompt: inlineEditCanvasContext,
  },
};

export const editCanvasSystemPrompt = (type: InPlaceEditType): string => {
  return prompts[type].systemPrompt;
};

export const editCanvasUserPrompt = (type: InPlaceEditType, query: string, selection: HighlightSelection): string => {
  return prompts[type].userPrompt(query, selection);
};

export const editCanvasContext = (type: InPlaceEditType, canvas: Canvas, selection: HighlightSelection): string => {
  return prompts[type].contextPrompt(canvas, selection);
};

// Re-export types and helpers
export * from './types';
export * from './helper';
