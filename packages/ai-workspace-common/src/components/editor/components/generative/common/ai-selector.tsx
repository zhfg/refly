import { useEditor } from '../../../core/components';
import { addAIHighlight } from '../../../core/extensions';
import { memo, useEffect, useRef, useState } from 'react';
import CrazySpinner from '../../ui/icons/crazy-spinner';
import Magic from '../../ui/icons/magic';
import { ScrollArea } from '../../ui/scroll-area';
import AICompletionCommands from '../inline/ai-completion-command';
import AISelectorCommands from '../inline/ai-selector-commands';
import { LOCALE } from '@refly/common-types';
import { editorEmitter, InPlaceEditType, InPlaceActionType } from '@refly/utils/event-emitter/editor';
import { Input } from '@arco-design/web-react';
import { Button } from 'antd';
import { cn } from '@refly/utils/cn';
import { getOsType } from '@refly/utils/env';
import { AddBaseMarkContext } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/components/add-base-mark-context';
import { AISettingsDropdown } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/chat-actions/ai-settings';

import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleBubbleClose?: () => void;
  inPlaceEditType: InPlaceEditType;
}

const getShortcutSymbols = (osType: string) => {
  if (osType === 'OSX') {
    return {
      edit: '↵', // Enter symbol
      chat: '⌘↵', // Command + Enter symbols
    };
  }
  return {
    edit: 'Enter',
    chat: 'Ctrl+Enter',
  };
};

export const AISelector = memo(({ onOpenChange, handleBubbleClose, inPlaceEditType }: AISelectorProps) => {
  const { editor } = useEditor();
  const [inputValue, setInputValue] = useState('');
  const [activeValue, setActiveValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const osType = getOsType();
  const shortcutSymbols = getShortcutSymbols(osType);

  const handleEmitInPlaceSendMessage = (actionType: InPlaceActionType) => {
    if (!inputValue.trim()) return;

    const selection = editor.state.selection;
    const startIndex = selection.from;
    const endIndex = selection.to;

    if (inPlaceEditType === 'block') {
      // Handle block type message
      editorEmitter.emit('inPlaceSendMessage', {
        userInput: inputValue,
        inPlaceActionType: actionType,
        canvasEditConfig: {
          inPlaceEditType: 'block',
          selectedRange: {
            startIndex: startIndex,
            endIndex: startIndex,
          },
          selection: {
            beforeHighlight: '',
            highlightedText: '',
            afterHighlight: '',
          },
        },
      });
    } else {
      // Handle inline type message
      const slice = editor.state.selection.content();
      const selectedMdText = editor.storage.markdown.serializer.serialize(slice.content);

      editorEmitter.emit('inPlaceSendMessage', {
        userInput: inputValue,
        inPlaceActionType: actionType,
        canvasEditConfig: {
          inPlaceEditType: 'inline',
          selectedRange: {
            startIndex,
            endIndex,
          },
          selection: {
            beforeHighlight: '',
            highlightedText: selectedMdText,
            afterHighlight: '',
          },
        },
      });
    }

    setIsLoading(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && e.shiftKey) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.preventDefault();

        // Get cursor position
        const cursorPos = e.target.selectionStart;
        // Create new value with newline
        const newValue = inputValue.slice(0, cursorPos as number) + '\n' + inputValue.slice(cursorPos as number);

        // Update state to trigger re-render and autoSize calculation
        setInputValue(newValue);

        // Need to restore cursor position after state update
        setTimeout(() => {
          if (e.target instanceof HTMLTextAreaElement) {
            e.target.selectionStart = e.target.selectionEnd = (cursorPos as number) + 1;
          }
        }, 0);
      }
    }

    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEmitInPlaceSendMessage('chat');
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleEmitInPlaceSendMessage('edit');
    }
  };

  // payload: Omit<InPlaceSendMessagePayload, 'userInput'>
  const handleAskAIResponse = () => {
    handleBubbleClose?.();
    // onOpenChange(false);
    // editorEmitter.emit('bubbleClose');
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
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

  useEffect(() => {
    editorEmitter.on('askAIResponse', handleAskAIResponse);

    return () => {
      editorEmitter.off('askAIResponse', handleAskAIResponse);
    };
  }, []);

  return (
    <div className="w-[500px] z-50" ref={ref}>
      {true && (
        <div className="flex max-h-[400px] overflow-y-auto">
          <div className="prose p-2 px-4 prose-sm">
            <Markdown content={'- hello\n- world'} />
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center px-4 w-full h-12 text-sm font-medium text-primary-600 text-muted-foreground">
          <Magic className="mr-2 w-4 h-4 shrink-0" />
          AI is thinking
          <div className="mt-1 ml-2">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="flex relative flex-row items-center" cmdk-input-wrapper="">
            <div className="flex flex-1 items-center pl-4 border-b" cmdk-input-wrapper="">
              <Button size="small" type="default" className="text-xs w-6 h-6 rounded border text-gray-500 gap-1 mr-1">
                <AISettingsDropdown
                  placement="bottomCenter"
                  collapsed={true}
                  briefMode={true}
                  modelSelectorPlacement="bottomCenter"
                />
              </Button>
              <AddBaseMarkContext source={MessageIntentSource.AISelector} />
              <Input.TextArea
                value={inputValue}
                autoSize={{
                  minRows: 1,
                  maxRows: 5,
                }}
                ref={(input) => {
                  if (input?.dom && inPlaceEditType === 'block') {
                    setTimeout(() => {
                      input.dom.focus();
                    }, 0);
                  }
                }}
                onChange={(val) => {
                  console.log('val', val);
                  setInputValue(val);
                }}
                style={{
                  borderRadius: 8,
                  resize: 'none',
                }}
                onKeyDown={handleKeyDown}
                autoFocus
                className={cn(
                  'flex py-3 mx-0.5 w-full h-11 text-sm border-none outline-none calc-width-64px important-outline-none important-box-shadow-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 !bg-transparent',
                )}
                placeholder={'Ask AI to edit or chat...'}
                onFocus={() => {
                  addAIHighlight(editor);
                }}
              />
            </div>
            <div className="flex flex-row gap-1 mr-2">
              <Button
                size="small"
                disabled={!inputValue}
                onClick={() => {
                  handleEmitInPlaceSendMessage('chat');
                }}
              >
                <span>Chat</span> <span>{shortcutSymbols.chat}</span>
              </Button>
              <Button
                type="primary"
                size="small"
                disabled={!inputValue}
                onClick={() => {
                  handleEmitInPlaceSendMessage('edit');
                }}
              >
                <span>Edit</span> <span>{shortcutSymbols.edit}</span>
              </Button>
            </div>
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
