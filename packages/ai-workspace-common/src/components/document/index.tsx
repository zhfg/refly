import { useEffect, useState } from 'react';
import { Document } from '@refly/openapi-schema';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

import './index.scss';
import { Input, Spin } from '@arco-design/web-react';
import { Button, Divider, Dropdown, DropdownProps, MenuProps, message, Popconfirm } from 'antd';
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineClock } from 'react-icons/hi2';
import { IconMoreHorizontal, IconDelete, IconCopy } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useTranslation } from 'react-i18next';
import { AiOutlineWarning } from 'react-icons/ai';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

import { CollaborativeEditor } from './collab-editor';
import { DocumentProvider, useDocumentContext } from '@refly-packages/ai-workspace-common/context/document';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/use-delete-node';
import { useDeleteDocument } from '@refly-packages/ai-workspace-common/hooks/use-delete-document';
import { useEditor } from '@refly-packages/ai-workspace-common/components/editor/core/components';

const ActionDropdown = ({ doc, node }: { doc: Document; node?: CanvasNode }) => {
  const { editor } = useEditor();
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const handleDeleteNode = node ? useDeleteNode(node, node.type) : undefined;
  const { deleteDocument } = useDeleteDocument();

  const handleDelete = async () => {
    const success = await deleteDocument(doc.docId);
    if (success) {
      handleDeleteNode();
    }
  };

  const handleCopy = () => {
    const markdown = editor?.storage.markdown.getMarkdown();
    copyToClipboard(markdown);
    message.success({ content: t('contentDetail.item.copySuccess') });
  };

  const items: MenuProps['items'] = [
    {
      key: 'copy',
      label: (
        <div className="flex items-center" onClick={handleCopy}>
          <IconCopy size={16} className="mr-2" />
          {t('contentDetail.item.copyContent')}
        </div>
      ),
    },
    {
      label: (
        <Popconfirm
          title={t('workspace.deleteDropdownMenu.deleteConfirmForDocument')}
          onConfirm={handleDelete}
          onCancel={() => setPopupVisible(false)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <div className="flex items-center text-red-600">
            <IconDelete size={16} className="mr-2" />
            {t('workspace.deleteDropdownMenu.delete')}
          </div>
        </Popconfirm>
      ),
      key: 'delete',
    },
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  return (
    <Dropdown
      trigger={['click']}
      open={popupVisible}
      onOpenChange={handleOpenChange}
      menu={{
        items,
      }}
    >
      <Button type="text" icon={<IconMoreHorizontal />} />
    </Dropdown>
  );
};

const StatusBar = ({
  deckSize,
  setDeckSize,
  docId,
  node,
}: {
  deckSize: number;
  setDeckSize: (size: number) => void;
  docId: string;
  node?: CanvasNode;
}) => {
  const { currentDocument, updateCurrentDocument, documentSaveStatus } = useDocumentStoreShallow((state) => ({
    currentDocument: state.documentStates[docId]?.currentDocument,
    updateCurrentDocument: state.updateCurrentDocument,
    documentSaveStatus: state.documentStates[docId]?.documentSaveStatus,
  }));
  const { provider } = useDocumentContext();
  const { t } = useTranslation();

  return (
    <div className="note-status-bar">
      <div className="note-status-bar-menu">
        {provider.status === 'connected' ? (
          <div className="note-status-bar-item">
            <HiOutlineClock />
            <p className="conv-title">
              {documentSaveStatus === 'Saved' ? t('knowledgeBase.note.autoSaved') : t('knowledgeBase.note.saving')}
            </p>
          </div>
        ) : null}

        {provider.status === 'disconnected' ? (
          <div className="note-status-bar-item">
            <AiOutlineWarning />
            <p className="conv-title">{t('knowledgeBase.note.serviceDisconnected')}</p>
          </div>
        ) : null}
      </div>

      <div className="note-status-bar-menu">
        {currentDocument && provider.status === 'connected' ? (
          <div
            className="note-status-bar-item"
            onClick={() => {
              updateCurrentDocument(docId, { ...currentDocument, readOnly: !currentDocument?.readOnly });
              currentDocument?.readOnly
                ? message.success(t('knowledgeBase.note.edit'))
                : message.warning(t('knowledgeBase.note.readOnly'));
            }}
          >
            <Button
              type="text"
              style={{ width: 32, height: 32 }}
              icon={
                currentDocument?.readOnly ? <HiOutlineLockClosed style={{ color: '#00968F' }} /> : <HiOutlineLockOpen />
              }
            />
          </div>
        ) : null}

        <div className="note-status-bar-item">
          <Divider type="vertical" />
          <ActionDropdown doc={currentDocument} node={node} />
        </div>
      </div>
    </div>
  );
};

export const DocumentEditorHeader = ({ docId }: { docId: string }) => {
  const { t } = useTranslation();
  const { ydoc } = useDocumentContext();
  const ydocTitle = ydoc.getText('title').toJSON();

  const { setNodeDataByEntity } = useCanvasControl();

  const onTitleChange = (newTitle: string) => {
    ydoc?.transact(() => {
      const yTitle = ydoc?.getText('title');
      yTitle?.delete(0, yTitle?.length ?? 0);
      yTitle?.insert(0, newTitle);
    });

    setNodeDataByEntity(
      {
        entityId: docId,
        type: 'document',
      },
      {
        title: newTitle,
      },
    );
  };

  return (
    <div className="w-full">
      <div className="mx-0 mt-4 max-w-screen-lg">
        <Input
          className="text-3xl font-bold bg-transparent focus:border-transparent focus:bg-transparent"
          placeholder={t('editor.placeholder.title')}
          value={ydocTitle}
          style={{ paddingLeft: 6 }}
          onChange={onTitleChange}
        />
      </div>
    </div>
  );
};

const DocumentBody = ({ docId }: { docId: string }) => {
  const { t } = useTranslation();
  const { provider } = useDocumentContext();

  const { config } = useDocumentStoreShallow((state) => ({
    config: state.config[docId],
  }));
  const hasDocumentSynced = config?.remoteSyncedAt > 0 && config?.localSyncedAt > 0;

  return (
    <div className="overflow-auto flex-grow">
      <Spin
        className="document-editor-spin"
        tip={t('knowledgeBase.note.connecting')}
        loading={!hasDocumentSynced && provider.status !== 'connected'}
        style={{ height: '100%', width: '100%' }}
      >
        <div className="ai-note-editor">
          <div className="ai-note-editor-container">
            <DocumentEditorHeader docId={docId} />
            <CollaborativeEditor docId={docId} />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export const DocumentEditor = (props: {
  docId: string;
  deckSize: number;
  setDeckSize: (size: number) => void;
  node?: CanvasNode;
}) => {
  const { docId, deckSize, setDeckSize, node } = props;

  const { resetState } = useDocumentStoreShallow((state) => ({
    resetState: state.resetState,
  }));

  useEffect(() => {
    return () => {
      resetState(docId);
    };
  }, []);

  return (
    <DocumentProvider docId={docId}>
      <div className="flex flex-col ai-note-container">
        <StatusBar deckSize={deckSize} setDeckSize={setDeckSize} docId={docId} node={node} />
        <DocumentBody docId={docId} />
      </div>
    </DocumentProvider>
  );
};
