import { Editor } from '@tiptap/core';
import { defaultExtensions } from './schema';

export const editor = new Editor({
  extensions: defaultExtensions,
});
