import mitt from 'mitt';

export interface InPlaceSendMessagePayload {
    type: 'inline' | 'block',
    userInput: string,
    selection: {
    startIndex: number,
    endIndex: number,
    },
}

export type Events = {
  insertBlow: string;
  replaceSelection: string;
  contineInChat: string;
  createNewNote: string;
  streamCanvasContent: string;
  updateCanvasTitle: string;
  activeAskAI: boolean
  inPlaceSendMessage: InPlaceSendMessagePayload
};

export type EditorOperation =
  | 'insertBlow'
  | 'replaceSelection'
  | 'contineInChat'
  | 'createNewNote'
  | 'streamCanvasContent'
  | 'updateCanvasTitle'
  | 'inPlaceSendMessage'
  | 'activeAskAI';

export const editorEmitter = mitt<Events>();
