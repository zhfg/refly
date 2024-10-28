import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Text,
  TextQuote,
} from 'lucide-react';
import { createSuggestionItems } from '@refly-packages/editor-core/extensions';
import { Command, renderItems } from '@refly-packages/editor-core/extensions';
import { createUploadFn } from './image-upload';
import Magic from '@refly-packages/editor-component/ui/icons/magic';
import { editorEmitter } from '@refly-packages/editor-core/utils/event';

export const configureSuggestionItems = (param: { entityId: string; entityType: string }) => {
  return createSuggestionItems([
    {
      title: 'Ask AI',
      description: 'Ask AI to help you write.',
      searchTerms: ['ai', 'assistant'],
      icon: <Magic className="w-5 h-5" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        editorEmitter.emit('activeAskAI', true);
      },
    },
    {
      title: 'Text',
      description: 'Just start typing with plain text.',
      searchTerms: ['p', 'paragraph'],
      icon: <Text size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
      },
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list.',
      searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
      icon: <CheckSquare size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      searchTerms: ['title', 'big', 'large'],
      icon: <Heading1 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      searchTerms: ['subtitle', 'medium'],
      icon: <Heading2 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      searchTerms: ['subtitle', 'small'],
      icon: <Heading3 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list.',
      searchTerms: ['unordered', 'point'],
      icon: <List size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      searchTerms: ['ordered'],
      icon: <ListOrdered size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote.',
      searchTerms: ['blockquote'],
      icon: <TextQuote size={18} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run(),
    },
    {
      title: 'Code',
      description: 'Capture a code snippet.',
      searchTerms: ['codeblock'],
      icon: <Code size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Image',
      description: 'Upload an image from your computer.',
      searchTerms: ['photo', 'picture', 'media'],
      icon: <ImageIcon size={18} />,
      command: ({ editor, range }) => {
        if (!editor) return;

        editor.chain().focus().deleteRange(range).run();
        // upload image
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        const uploadFn = createUploadFn(param);

        input.onchange = async () => {
          if (input.files?.length) {
            const file = input.files[0];
            const pos = editor.view?.state?.selection?.from;
            if (pos) {
              uploadFn(file, editor.view, pos);
            }
          }
        };
        input.click();
      },
    },
  ]);
};

export const configureSlashCommand = (param: { entityId: string; entityType: string }) => {
  return Command.configure({
    suggestion: {
      items: () => configureSuggestionItems(param),
      render: renderItems,
    },
  });
};
