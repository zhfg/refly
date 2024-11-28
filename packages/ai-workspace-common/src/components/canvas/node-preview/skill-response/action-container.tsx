import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { Message } from '@arco-design/web-react';
import { Source } from '@refly/openapi-schema';
import { FilePlus } from 'lucide-react';
import { IconCheckCircle, IconCopy, IconImport } from '@arco-design/web-react/icon';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { parseMarkdownCitationsAndCanvasTags, safeParseJSON } from '@refly/utils/parse';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { EditorOperation } from '@refly-packages/utils/event-emitter/editor';
import { MdOutlineToken } from 'react-icons/md';
import { Dropdown, Menu } from '@arco-design/web-react';

interface ActionContainerProps {
  result: any;
  resultId: string;
}

export const ActionContainer = ({ result, resultId }: ActionContainerProps) => {
  const { t } = useTranslation();
  const { editor: noteStoreEditor, isCreatingNewDocumentOnHumanMessage } = useDocumentStoreShallow((state) => ({
    editor: state.editor,
    isCreatingNewDocumentOnHumanMessage: state.isCreatingNewDocumentOnHumanMessage,
  }));
  const { debouncedCreateDocument, isCreating } = useCreateDocument();

  const { invokeParam, actionMeta, logs } = result ?? {};
  const { input, context } = invokeParam ?? {};
  const isPending = result?.status === 'executing';

  // Track editor selection state
  const [hasEditorSelection, setHasEditorSelection] = useState(false);
  let sources =
    typeof result?.structuredData?.['sources'] === 'string'
      ? safeParseJSON(result?.structuredData?.['sources'])
      : (result?.structuredData?.['sources'] as Source[]);

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
    (result?.tokenUsage || []).forEach((item) => {
      total += (item?.inputTokens || 0) + (item?.outputTokens || 0);
    });
    setTokenUsage(total);
  }, [result?.tokenUsage]);

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
        sourceNodeId: resultId,
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
      {result?.tokenUsage?.map((item: any, index: number) => (
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
    <div className="ai-copilot-answer-action-container">
      {result?.tokenUsage?.length > 0 && (
        <div className="ai-copilot-answer-token-usage">
          <Dropdown droplist={tokenUsageDropdownList}>
            <Button type="text" icon={<MdOutlineToken style={{ fontSize: 14 }} />} className={'assist-action-item'}>
              {tokenUsage} Tokens
            </Button>
          </Dropdown>
        </div>
      )}
      {!isPending && (
        <div className="session-answer-actionbar">
          <div className="session-answer-actionbar-left">
            <Button
              type="text"
              icon={<IconCopy style={{ fontSize: 14 }} />}
              style={{ color: '#64645F' }}
              className={'assist-action-item'}
              onClick={() => {
                const parsedText = parseMarkdownCitationsAndCanvasTags(result.content, sources);
                copyToClipboard(parsedText || '');
                Message.success(t('copilot.message.copySuccess'));
              }}
            >
              <span className="action-text">{t('copilot.message.copy')}</span>
            </Button>
            {availableEditorActions.map((item) => (
              <Button
                loading={item.key === 'createDocument' && (isCreatingNewDocumentOnHumanMessage || isCreating)}
                type="text"
                className={'assist-action-item'}
                icon={item.icon}
                style={{ color: '#64645F' }}
                onClick={() => {
                  const parsedText = parseMarkdownCitationsAndCanvasTags(result.content, sources);
                  handleEditorOperation(item.key as EditorOperation, parsedText || '');
                }}
              >
                <span className="action-text">{t(`copilot.message.${item.key}`)}</span>
              </Button>
            ))}
          </div>
          <div className="session-answer-actionbar-right"></div>
        </div>
      )}
    </div>
  );
};
