'use client';

import { ArrowUp } from 'lucide-react';
import { useEditor } from '@refly-packages/editor-core/components';
import { addAIHighlight } from '@refly-packages/editor-core/extensions';
import { memo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import CrazySpinner from '../../ui/icons/crazy-spinner';
import Magic from '../../ui/icons/magic';
import { ScrollArea } from '../../ui/scroll-area';
import AICompletionCommands from './ai-completion-command';
import AISelectorCommands from './ai-selector-commands';
import { LOCALE } from '@refly/common-types';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import { Input } from '@arco-design/web-react';
import { cn } from '@refly-packages/editor-component/utils';
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleBubbleClose: () => void;
}

export const AISelector = memo(({ onOpenChange, handleBubbleClose }: AISelectorProps) => {
  const { editor } = useEditor();
  const [inputValue, setInputValue] = useState('');
  const [activeValue, setActiveValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const { completion, completionMsg, chat, isLoading } = useChat({
  //   // id: @refly-packages/editor-core,
  //   onResponse: (response) => {
  //     if (response.status === 429) {
  //       toast.error('You have reached your request limit for the day.');
  //       return;
  //     }
  //   },
  //   onError: (e) => {
  //     toast.error(e.message);
  //   },
  // });

  // const hasCompletion = completion.length > 0;

  return (
    <div className="w-[350px]" ref={ref}>
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
              onClick={() => {
                const selection = editor.state.selection;
                const startIndex = selection.from;
                const endIndex = selection.to;

                const slice = editor.state.selection.content();
                const selectedMdText = editor.storage.markdown.serializer.serialize(slice.content);

                editorEmitter.emit('inPlaceSendMessage', {
                  type: 'inline',
                  userInput: inputValue,
                  selection: {
                    startIndex,
                    endIndex,
                    selectedMdText,
                  },
                });

                handleBubbleClose();
              }}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
          {
            // <AISelectorCommands
            //   onSelect={(value, option) =>
            //     chat({
            //       userPrompt: option,
            //       context: {
            //         type: 'text',
            //         content: value,
            //       },
            //       config: {
            //         locale: 'en' as LOCALE,
            //       },
            //     })
            //   }
            // />
          }
        </>
      )}
    </div>
  );
});
