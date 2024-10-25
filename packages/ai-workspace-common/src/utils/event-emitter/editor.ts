import mitt from 'mitt';

type Events = {
  insertBlow: string;
  replaceSelection: string;
  contineInChat: string;
  createNewNote: string;
  streamCanvasContent: string;
};

export type EditorOperation =
  | 'insertBlow'
  | 'replaceSelection'
  | 'contineInChat'
  | 'createNewNote'
  | 'streamCanvasContent';

export const editorEmitter = mitt<Events>();
