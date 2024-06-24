import { Button } from '../ui/button';
import { cn } from '../utils';
import { SaveIcon } from 'lucide-react';
import { EditorBubbleItem, useEditor } from '@refly-packages/editor-core/components';
import type { SelectorItem } from './node-selector';
import copyToClipboard from 'copy-to-clipboard';
import { Message as message } from '@arco-design/web-react';

interface SaveButtonProps {
  onOpenChange: (open: boolean) => void;
}

export const SaveButton = ({ onOpenChange }: SaveButtonProps) => {
  const { editor } = useEditor();
  if (!editor) return null;
  const items: SelectorItem[] = [
    {
      name: 'save',
      isActive: (editor) => editor.isActive('save'),
      command: (editor) => {
        const selectedText = editor.view.state.doc.textBetween(
          editor.view.state.selection.from,
          editor.view.state.selection.to,
          ' ',
        );
        copyToClipboard(selectedText);
        message.success('内容已复制在剪切板！');
        onOpenChange(true);
      },
      icon: SaveIcon,
    },
  ];
  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => {
            item.command(editor);
          }}
        >
          <Button size="sm" className="rounded-none" variant="ghost">
            <item.icon
              className={cn('h-4 w-4', {
                'text-blue-500': item.isActive(editor),
              })}
            />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
