import mitt from 'mitt';

export type InPlaceEditType = 'inline' | 'block';

export interface CanvasEditConfig {
  selection?: {
    beforeHighlight: string;
    highlightedText: string;
    afterHighlight: string;
  };
  selectedRange?: {
    startIndex: number;
    endIndex: number;
  };
  inPlaceEditType?: InPlaceEditType;
}

export interface InPlaceSendMessagePayload extends CanvasEditConfig {
  userInput: string;
}

export type Events = {
  insertBlow: string;
  replaceSelection: string;
  contineInChat: string;
  createNewNote: string;
  streamCanvasContent: string;
  streamEditCanvasContent: {
    isFirst: boolean;
    content: string;
  };
  updateCanvasTitle: string;
  activeAskAI: boolean;
  inPlaceSendMessage: InPlaceSendMessagePayload;
};

export type EditorOperation =
  | 'insertBlow'
  | 'replaceSelection'
  | 'contineInChat'
  | 'createNewNote'
  | 'streamCanvasContent'
  | 'streamEditCanvasContent'
  | 'updateCanvasTitle'
  | 'inPlaceSendMessage'
  | 'activeAskAI';

export const editorEmitter = mitt<Events>();
