import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useEditor } from '../../../core/components';
import { addAIHighlight } from '../../../core/extensions';
import CrazySpinner from '../../ui/icons/crazy-spinner';
import Magic from '../../ui/icons/magic';
import AICompletionCommands from '../inline/ai-completion-command';
import AISelectorCommands from '../inline/ai-selector-commands';
import { editorEmitter, InPlaceEditType, InPlaceActionType, CanvasEditConfig } from '@refly/utils/event-emitter/editor';
import { Input } from '@arco-design/web-react';
import { Button } from 'antd';
import { cn } from '@refly/utils/cn';
import { getOsType } from '@refly/utils/env';
import { AddBaseMarkContext } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/components/add-base-mark-context';
import { AISettingsDropdown } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/chat-actions/ai-settings';

import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { useInvokeAction } from '@refly-packages/ai-workspace-common/hooks/use-invoke-action';
import { useTranslation } from 'react-i18next';
import { ActionResult, ActionStatus, ConfigScope, InvokeSkillRequest } from '@refly/openapi-schema';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { genActionResultID } from '@refly-packages/utils/index';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { LOCALE } from '@refly/common-types';
import { HiCheck, HiXMark } from 'react-icons/hi2';
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { useDocumentContext } from '@refly-packages/ai-workspace-common/context/document';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

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
    edit: '↵',
    chat: 'Ctrl+↵',
  };
};

export const AISelector = memo(({ onOpenChange, handleBubbleClose, inPlaceEditType }: AISelectorProps) => {
  const { t } = useTranslation();
  const { editor } = useEditor();
  const [inputValue, setInputValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const osType = getOsType();
  const shortcutSymbols = getShortcutSymbols(osType);

  const [resultId, setResultId] = useState('');
  console.log('resultId', resultId);
  const [resultContent, setResultContent] = useState('');
  const [resultStatus, setResultStatus] = useState<ActionStatus>('waiting');
  const { docId } = useDocumentContext();
  const { invokeAction } = useInvokeAction();

  const handleEdit = (actionType: InPlaceActionType) => {
    const selection = editor.state.selection;
    const startIndex = selection.from;
    const endIndex = selection.to;

    const slice = editor.state.selection.content();
    const selectedMdText = editor.storage.markdown.serializer.serialize(slice.content);

    const canvasEditConfig: CanvasEditConfig = {
      inPlaceEditType,
      selectedRange: {
        startIndex,
        endIndex,
      },
      selection: {
        beforeHighlight: '',
        highlightedText: selectedMdText,
        afterHighlight: '',
      },
    };

    const { localSettings } = useUserStore.getState();
    const { uiLocale } = localSettings;

    const { selectedModel } = useChatStore.getState();
    const resultId = genActionResultID();
    setResultId(resultId);

    const param: InvokeSkillRequest = {
      resultId,
      input: {
        query: inputValue,
      },
      target: {
        entityId: docId,
        entityType: 'document',
      },
      context: {
        documents: [
          {
            docId,
            isCurrent: true,
            metadata: {
              isCurrentContext: true,
            },
          },
        ],
      },
      skillName: 'editDoc',
      tplConfig: {
        canvasEditConfig: {
          value: canvasEditConfig as { [key: string]: unknown },
          configScope: 'runtime' as unknown as ConfigScope,
          displayValue: localSettings?.uiLocale === 'zh-CN' ? '编辑文档配置' : 'Edit Document Config',
          label: localSettings?.uiLocale === 'zh-CN' ? '编辑文档配置' : 'Edit Document Config',
        },
      },
      modelName: selectedModel?.name,
    };

    if (actionType === 'chat') {
      const { selection } = canvasEditConfig || {};
      const selectedText = selection?.highlightedText || '';

      if (selectedText) {
        param.input.query =
          `> ${uiLocale === LOCALE.EN ? '**User Selected Text:** ' : '**用户选中的文本:** '} ${selectedText}` +
          `\n\n` +
          `${uiLocale === LOCALE.EN ? '**Please answer question based on the user selected text:** ' : '**请根据用户选中的文本回答问题:** '} ${inputValue}`;
      }
    }

    setIsLoading(true);
    invokeAction(param);
  };

  const updateResult = useCallback(
    (update: { resultId: string; payload: ActionResult }) => {
      if (update?.resultId === resultId) {
        if (isLoading) {
          setIsLoading(false);
        }
        const { steps, status } = update?.payload;
        setResultStatus(status);
        setResultContent(steps?.map((step) => step?.content).join('\n\n'));
      }
    },
    [resultId],
  );

  useEffect(() => {
    actionEmitter.on('updateResult', updateResult);

    return () => {
      actionEmitter.off('updateResult', updateResult);
    };
  }, [resultId]);

  useEffect(() => {
    return () => {
      setResultId('');
      setResultContent('');
      setResultStatus('waiting');
    };
  }, []);

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
      handleEdit('chat');
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleEdit('edit');
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

  const handleReplace = () => {
    const selection = editor.view.state.selection;

    editor.chain().focus().insertContentAt(selection, resultContent).run();
  };

  console.log('resultStatus', resultStatus);
  return (
    <div className="w-[405px] z-50" ref={ref}>
      {(resultId && ['waiting', 'executing'].includes(resultStatus)) || isLoading ? (
        <div className="flex items-center px-4 w-full h-12 text-sm font-medium text-primary-600 text-muted-foreground">
          <Magic className="mr-2 w-4 h-4 shrink-0" />
          {t('editor.aiSelector.thinking')}
          <div className="mt-1 ml-2">
            <CrazySpinner />
          </div>
        </div>
      ) : null}
      {resultId && !isLoading && (
        <div className="flex flex-col">
          <>
            <div className="max-h-[400px] overflow-y-auto prose p-2 px-4 prose-sm">
              <Markdown content={resultContent} />
            </div>
            {resultStatus === 'finish' && (
              <div className="flex flex-row gap-1 px-4">
                <Button size="small" icon={<HiCheck className="text-primary-600" />} onClick={handleReplace}>
                  {t('copilot.chatActions.replace')}
                </Button>
                <Button size="small" icon={<HiXMark className="text-red-600" />} onClick={() => onOpenChange(false)}>
                  {t('copilot.chatActions.reject')}
                </Button>
              </div>
            )}
          </>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex relative flex-row items-center" cmdk-input-wrapper="">
            <div className="flex flex-1 items-center pl-4 border-b" cmdk-input-wrapper="">
              <Button size="small" type="default" className="text-xs w-6 h-6 rounded border text-gray-500 gap-1 mr-1">
                <AISettingsDropdown
                  placement="bottom"
                  collapsed={true}
                  briefMode={true}
                  modelSelectorPlacement="bottom"
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
                placeholder={t('copilot.chatInput.editPlaceholder')}
                onFocus={() => {
                  addAIHighlight(editor);
                }}
              />
            </div>
            <div className="flex flex-row gap-1 mr-2">
              <Button
                type="primary"
                size="small"
                disabled={!inputValue}
                onClick={() => {
                  handleEdit('edit');
                }}
              >
                <span>{t('copilot.chatActions.send')}</span> <span>{shortcutSymbols.edit}</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
