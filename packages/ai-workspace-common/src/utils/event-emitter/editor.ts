import mitt from 'mitt';

type Events = {
  insertBlow: string;
  replaceSelection: string;
  contineInChat: string;
  createNewNote: string;
};

export const editorEmitter = mitt<Events>();
