import mitt from 'mitt';

type Events = {
  insertBlow: string;
  replaceSelection: string;
  contineInChat: string;
  createNewNote: string;
};

export type EditorOperation = 'insertBlow' | 'replaceSelection' | 'contineInChat' | 'createNewNote';

export const editorEmitter = mitt<Events>();
