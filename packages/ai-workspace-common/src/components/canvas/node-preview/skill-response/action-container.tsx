import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { Message } from '@arco-design/web-react';
import { ActionResult, ActionStep, Source } from '@refly/openapi-schema';
import { FilePlus } from 'lucide-react';
import { IconCheckCircle, IconCopy, IconImport } from '@arco-design/web-react/icon';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { parseMarkdownCitationsAndCanvasTags, safeParseJSON } from '@refly/utils/parse';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { EditorOperation } from '@refly-packages/utils/event-emitter/editor';
import { Dropdown, Menu } from '@arco-design/web-react';
import { HiOutlineCircleStack } from 'react-icons/hi2';

interface ActionContainerProps {
  step: ActionStep;
  result: ActionResult;
}

export const ActionContainer = ({ result, step }: ActionContainerProps) => {
  const { t } = useTranslation();
  const { editor: noteStoreEditor, isCreatingNewDocumentOnHumanMessage } = useDocumentStoreShallow((state) => ({
    editor: state.editor,
    isCreatingNewDocumentOnHumanMessage: state.isCreatingNewDocumentOnHumanMessage,
  }));
  const { debouncedCreateDocument, isCreating } = useCreateDocument();

  const { invokeParam } = result ?? {};
  const { input } = invokeParam ?? {};
  const isPending = result?.status === 'executing';

  // Track editor selection state
  const [hasEditorSelection, setHasEditorSelection] = useState(false);
  let sources =
    typeof step?.structuredData?.['sources'] === 'string'
      ? safeParseJSON(step?.structuredData?.['sources'])
      : (step?.structuredData?.['sources'] as Source[]);

  const editorActionList = [
    {
      icon: <IconImport style={{ fontSize: 14 }} />,
      key: 'insertBlow',
    },
    {
      icon: <IconCheckCircle style={{ fontSize: 14 }} />,
      key: 'replaceSelection',
    },
    {
      icon: <FilePlus style={{ fontSize: 14, width: 14, height: 14 }} />,
      key: 'createDocument',
      loading: isCreating,
    },
  ];

  const [tokenUsage, setTokenUsage] = useState(0);

  useEffect(() => {
    let total = 0;
    (step?.tokenUsage || []).forEach((item) => {
      total += (item?.inputTokens || 0) + (item?.outputTokens || 0);
    });
    setTokenUsage(total);
  }, [step?.tokenUsage]);

  const handleEditorOperation = async (type: EditorOperation, content: string) => {
    const parsedContent = parseMarkdownCitationsAndCanvasTags(content, sources);

    if (type === 'insertBlow' || type === 'replaceSelection') {
      const editor = noteStoreEditor;

      if (!editor) return;

      const selection = editor.view?.state?.selection;

      if (selection) {
        editor
          .chain()
          .focus()
          .insertContentAt(
            {
              from: selection.from,
              to: selection.to,
            },
            parsedContent,
          )
          .run();
      }
    } else if (type === 'createDocument') {
      await debouncedCreateDocument(input?.query ?? 'New Document', content, {
        sourceNodeId: result.resultId,
        addToCanvas: true,
      });
    }
  };

  useEffect(() => {
    if (!noteStoreEditor) {
      setHasEditorSelection(false);
      return;
    }

    const updateSelection = () => {
      const { state } = noteStoreEditor.view;
      const { from, to } = state.selection;
      setHasEditorSelection(from !== to);
    };

    // Update initial state
    updateSelection();

    // Listen for selection changes
    noteStoreEditor.on('selectionUpdate', updateSelection);
    noteStoreEditor.on('blur', updateSelection);
    noteStoreEditor.on('focus', updateSelection);

    return () => {
      noteStoreEditor.off('selectionUpdate', updateSelection);
      noteStoreEditor.off('blur', updateSelection);
      noteStoreEditor.off('focus', updateSelection);
    };
  }, [noteStoreEditor]);

  // Filter editor actions based on conditions
  const availableEditorActions = useMemo(() => {
    if (!step.content) {
      return [];
    }

    if (!noteStoreEditor) {
      // If no editor, only show create new note
      return editorActionList.filter((item) => item.key === 'createDocument');
    }

    if (!hasEditorSelection) {
      // If no selection, show create new note and insert below
      return editorActionList.filter((item) => ['createDocument', 'insertBlow'].includes(item.key));
    }

    // If has selection, show all actions
    return editorActionList;
  }, [noteStoreEditor, hasEditorSelection]);

  const tokenUsageDropdownList = (
    <Menu>
      {step?.tokenUsage?.map((item: any, index: number) => (
        <Menu.Item key={'token-usage-' + index}>
          <div className="flex items-center">
            <span>
              {item?.modelName}:{' '}
              {t('copilot.tokenUsage', {
                inputCount: item?.inputTokens,
                outputCount: item?.outputTokens,
              })}
            </span>
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className="mx-4 mt-2 flex items-center justify-between">
      <div className="-ml-1">
        {step?.tokenUsage?.length > 0 && (
          <Dropdown droplist={tokenUsageDropdownList}>
            <Button
              type="text"
              size="small"
              icon={<HiOutlineCircleStack style={{ fontSize: 14 }} />}
              className="text-gray-500 text-xs"
            >
              {tokenUsage} Tokens
            </Button>
          </Dropdown>
        )}
      </div>
      {!isPending && (
        <div className="flex flex-row justify-between items-center text-sm">
          <div className="-ml-1 text-sm flex flex-row items-center">
            {step.content && (
              <Button
                type="text"
                size="small"
                icon={<IconCopy style={{ fontSize: 14 }} />}
                className="text-[#64645F] text-xs flex justify-center items-center h-6 px-1 rounded-lg hover:bg-[#f1f1f0] hover:text-[#00968f] transition-all duration-400 relative overflow-hidden group"
                onClick={() => {
                  const parsedText = parseMarkdownCitationsAndCanvasTags(step.content, sources);
                  copyToClipboard(parsedText || '');
                  Message.success(t('copilot.message.copySuccess'));
                }}
              >
                <span className="opacity-0 max-w-0 transform -translate-x-0.5 transition-all duration-400 whitespace-nowrap group-hover:opacity-100 group-hover:max-w-[200px] group-hover:translate-x-0 group-hover:ml-1">
                  {t('copilot.message.copy')}
                </span>
              </Button>
            )}
            {availableEditorActions.map((item) => (
              <Button
                key={item.key}
                size="small"
                loading={item.key === 'createDocument' && (isCreatingNewDocumentOnHumanMessage || isCreating)}
                type="text"
                className="text-[#64645F] text-xs flex justify-center items-center h-6 px-1 rounded-lg hover:bg-[#f1f1f0] hover:text-[#00968f] transition-all duration-400 relative overflow-hidden group"
                icon={item.icon}
                onClick={() => {
                  const parsedText = parseMarkdownCitationsAndCanvasTags(step.content, sources);
                  handleEditorOperation(item.key as EditorOperation, parsedText || '');
                }}
              >
                <span className="opacity-0 max-w-0 transform -translate-x-0.5 transition-all duration-400 whitespace-nowrap group-hover:opacity-100 group-hover:max-w-[200px] group-hover:translate-x-0 group-hover:ml-1">
                  {t(`copilot.message.${item.key}`)}
                </span>
              </Button>
            ))}
          </div>
          <div></div>
        </div>
      )}
    </div>
  );
};
