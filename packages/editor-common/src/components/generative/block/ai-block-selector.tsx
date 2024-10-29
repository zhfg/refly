'use client';

import { Command, CommandInput } from '../../ui/command';
import { ArrowUp } from 'lucide-react';
import { useEditor } from '@refly-packages/editor-core/components';
import { addAIHighlight } from '@refly-packages/editor-core/extensions';
import { memo, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import CrazySpinner from '../../ui/icons/crazy-spinner';
import Magic from '../../ui/icons/magic';
import { ScrollArea } from '../../ui/scroll-area';
import { Input } from '@arco-design/web-react';
import AICompletionCommands from './ai-completion-block-command';
import AISelectorCommands from './ai-block-commands';
import { LOCALE } from '@refly/common-types';
import { cn } from '@refly-packages/editor-component/utils';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AIBlockSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIBlockSelector = memo(({ onOpenChange }: AIBlockSelectorProps) => {
  const { editor } = useEditor();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        editorEmitter.emit('activeAskAI', false);
        // Focus editor after closing AI selector
        setTimeout(() => {
          editor?.commands.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onOpenChange, editor]);

  const completion = '';

  const hasCompletion = completion.length > 0;

  const handleSendMessage = () => {
    const selection = editor.state.selection;
    const startIndex = selection.from;
    const currentNode = selection.$anchor.node();

    // 如果在已有内容的行中，可以选择在当前位置插入或者新起一行
    const shouldInsertNewLine = !currentNode.isTextblock || currentNode.textContent.length > 0;

    if (shouldInsertNewLine) {
      // 在当前位置后插入新行
      editor.chain().focus().insertContentAt(startIndex, '\n').run();
    }

    editorEmitter.emit('inPlaceSendMessage', {
      type: 'block',
      userInput: inputValue,
      selection: {
        startIndex: shouldInsertNewLine ? startIndex + 1 : startIndex,
        endIndex: shouldInsertNewLine ? startIndex + 1 : startIndex,
        selectedMdText: '',
      },
    });
  };

  return (
    <Command className="w-[350px]">
      {isLoading && (
        <div className="flex items-center px-4 w-full h-12 text-sm font-medium text-purple-500 text-muted-foreground">
          <Magic className="mr-2 w-4 h-4 shrink-0" />
          AI is thinking
          <div className="mt-1 ml-2">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative" cmdk-input-wrapper="">
            <div className="flex items-center px-4 border-b" cmdk-input-wrapper="">
              <Magic className="mr-2 w-4 h-4 text-purple-500 shrink-0" />
              <Input
                ref={(input) => {
                  if (input?.dom) {
                    setTimeout(() => {
                      input.dom.focus();
                    }, 0);
                  }
                }}
                value={inputValue}
                onChange={(val) => {
                  console.log('val', val);
                  setInputValue(val);
                }}
                autoFocus
                className={cn(
                  'flex py-3 w-full h-11 text-sm bg-transparent rounded-md border-none outline-none calc-width-50px important-outline-none important-box-shadow-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                )}
                placeholder={'Ask AI to edit or generate...'}
                onFocus={() => {
                  addAIHighlight(editor);
                }}
              />
            </div>
            <Button
              size="icon"
              disabled={!inputValue}
              className="absolute right-2 top-1/2 w-6 h-6 bg-purple-500 rounded-full -translate-y-1/2 hover:bg-purple-900"
              onClick={handleSendMessage}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Command>
  );
});
