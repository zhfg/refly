import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

import './index.scss';
import { Input, Spin } from '@arco-design/web-react';
import { Button, Dropdown, DropdownProps, MenuProps, message, Popconfirm } from 'antd';
import { HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi2';
import { IconMoreHorizontal, IconDelete, IconCopy } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useTranslation } from 'react-i18next';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

import { CollaborativeEditor } from './collab-editor';
import { DocumentProvider, useDocumentContext } from '@refly-packages/ai-workspace-common/context/document';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/use-delete-node';
import { useDeleteDocument } from '@refly-packages/ai-workspace-common/hooks/use-delete-document';
import { ydoc2Markdown } from '@refly-packages/utils/editor';
import { time } from '@refly-packages/utils/time';
import { LOCALE } from '@refly/common-types';

const ActionDropdown = ({ docId, node }: { docId: string; node?: CanvasNode }) => {
  const { ydoc } = useDocumentContext();
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const handleDeleteNode = node ? useDeleteNode(node, node.type) : undefined;
  const { deleteDocument } = useDeleteDocument();

  const handleDelete = async () => {
    const success = await deleteDocument(docId);
    if (success) {
      handleDeleteNode();
    }
  };

  const handleCopy = () => {
    const title = ydoc.getText('title').toJSON();
    const content = ydoc2Markdown(ydoc);
    copyToClipboard(`# ${title}\n\n${content}`);
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
          placement="bottom"
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
  const { provider, ydoc } = useDocumentContext();
  const yReadOnly = ydoc?.getText('readOnly');
  const { t, i18n } = useTranslation();
  const language = i18n.language as LOCALE;

  const [unsyncedChanges, setUnsyncedChanges] = useState(provider?.unsyncedChanges || 0);
  const [debouncedUnsyncedChanges] = useDebounce(unsyncedChanges, 500);

  useEffect(() => {
    provider.on('unsyncedChanges', (data) => {
      setUnsyncedChanges(data);
    });
  }, [provider]);

  const { config, setDocumentReadOnly } = useDocumentStoreShallow((state) => ({
    config: state.config[docId],
    setDocumentReadOnly: state.setDocumentReadOnly,
  }));
  const readOnly = config?.readOnly;

  useEffect(() => {
    if (ydoc) {
      setDocumentReadOnly(docId, yReadOnly?.toJSON() === 'true');

      const observer = () => {
        if (provider.status === 'connected') {
          setDocumentReadOnly(docId, yReadOnly?.toJSON() === 'true');
        }
      };
      yReadOnly?.observe(observer);

      return () => {
        yReadOnly?.unobserve(observer);
      };
    }
  }, [ydoc]);

  const toggleReadOnly = () => {
    ydoc?.transact(() => {
      const yReadOnly = ydoc.getText('readOnly');
      yReadOnly.delete(0, yReadOnly?.length ?? 0);
      yReadOnly.insert(0, (!readOnly).toString());
    });

    setDocumentReadOnly(docId, !readOnly);

    readOnly ? message.success(t('knowledgeBase.note.edit')) : message.warning(t('knowledgeBase.note.readOnly'));
  };

  return (
    <div className="w-full h-10 p-3 border-x-0 border-t-0 border-b border-solid border-gray-100 flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`
                  relative w-2.5 h-2.5 rounded-full
                  transition-colors duration-700 ease-in-out
                  ${debouncedUnsyncedChanges > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-400'}
                `}
        />
        <div className="text-sm text-gray-500">
          {debouncedUnsyncedChanges > 0
            ? t('canvas.toolbar.syncingChanges')
            : t('canvas.toolbar.synced', { time: time(new Date(), language)?.utc()?.fromNow() })}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="text"
          icon={readOnly ? <HiOutlineLockClosed style={{ color: '#00968F' }} /> : <HiOutlineLockOpen />}
          onClick={() => toggleReadOnly()}
        />
        <ActionDropdown docId={docId} node={node} />
      </div>
    </div>
  );
};

const DocumentEditorHeader = ({ docId }: { docId: string }) => {
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
