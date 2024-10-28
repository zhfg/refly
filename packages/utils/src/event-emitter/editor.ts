import mitt from 'mitt';

export interface InPlaceSendMessagePayload {
  type: 'inline' | 'block';
  userInput: string;
  selection: {
    startIndex: number;
    endIndex: number;
    selectedMdText: string;
  };
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
