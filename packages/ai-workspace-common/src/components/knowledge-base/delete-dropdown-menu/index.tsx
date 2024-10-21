import { useState } from 'react';
import { RiDeleteBinLine, RiMoreFill } from 'react-icons/ri';
import { TbEdit } from 'react-icons/tb';
import { Dropdown, Menu, Button, Popconfirm, Message } from '@arco-design/web-react';

import { Canvas, Project, Resource, BindProjectResourcesRequest } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';
import { useImportKnowledgeModal } from '@refly-packages/ai-workspace-common/stores/import-knowledge-modal';
import { IconCopy } from '@arco-design/web-react/icon';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(3px)',
};

type positionType = 'left' | 'tr' | 'br' | 'tl' | 'bl' | 'top' | 'bottom' | 'right' | 'lb' | 'rb' | 'lt' | 'rt';

interface DropListProps {
  type: string;
  canCopy?: boolean;
  position?: positionType;
  handleCancel: (e: any) => void;
  handleDeleteClick: (e: any) => Promise<void>;
  handlEditKnowledgeBase?: (e: any) => void;
  getPopupContainer?: () => HTMLElement;
}

const DropList = (props: DropListProps) => {
  const { handleCancel, handleDeleteClick, handlEditKnowledgeBase, type, getPopupContainer, position, canCopy } = props;
  const canvasStore = useCanvasStore((state) => ({
    editor: state.editor,
  }));
  const { t } = useTranslation();

  return (
    <Menu onClick={(e) => e.stopPropagation()}>
      {type === 'knowledgeBase' && (
        <Menu.Item key="edit">
          <div onClick={(e) => handlEditKnowledgeBase(e)}>
            <TbEdit style={iconStyle} />
            {t('workspace.deleteDropdownMenu.edit')}
          </div>
        </Menu.Item>
      )}

      {canCopy && (
        <Menu.Item key="copy">
          <div
            onClick={(e) => {
              e.stopPropagation();
              const editor = canvasStore.editor;
              if (editor) {
                const markdown = editor.storage.markdown.getMarkdown();
                copyToClipboard(markdown);
                Message.success({ content: t('contentDetail.item.copySuccess') });
              }
            }}
          >
            <IconCopy style={iconStyle} />
            {t('contentDetail.item.copyContent')}
          </div>
        </Menu.Item>
      )}

      <Menu.Item key="delete">
        <Popconfirm
          focusLock
          getPopupContainer={getPopupContainer}
          title={t(`common.deleteConfirmMessage`)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          position={position || 'br'}
          onOk={handleDeleteClick}
          onCancel={handleCancel}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <RiDeleteBinLine style={iconStyle} />
            {t('workspace.deleteDropdownMenu.delete')}
          </div>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );
};

interface DeleteDropdownMenuProps {
  postDeleteList?: (canvas: Canvas | Project | Resource | BindProjectResourcesRequest) => void;
  getPopupContainer?: () => HTMLElement;
  deleteConfirmPosition?: positionType;
  canCopy?: boolean;
}

interface CanvasPros extends DeleteDropdownMenuProps {
  type: 'canvas';
  data: Canvas;
}

interface KnowledgeBasePros extends DeleteDropdownMenuProps {
  type: 'knowledgeBase';
  data: Project;
}

interface ResourcePros extends DeleteDropdownMenuProps {
  type: 'resource';
  data: Resource;
}

interface ResourceCollectionPros extends DeleteDropdownMenuProps {
  type: 'resourceCollection';
  data?: BindProjectResourcesRequest;
}

export const DeleteDropdownMenu = (props: CanvasPros | KnowledgeBasePros | ResourcePros | ResourceCollectionPros) => {
  const { type, data, postDeleteList, getPopupContainer, deleteConfirmPosition, canCopy } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();

  const importKnowledgeModal = useImportKnowledgeModal();

  const handleDeleteClick = async (e: MouseEvent) => {
    e.stopPropagation();
    let resultError: unknown;
    if (type === 'canvas') {
      const { error } = await getClient().deleteCanvas({ body: { canvasId: data.canvasId } });
      resultError = error;
    }
    if (type === 'knowledgeBase') {
      const { error } = await getClient().deleteProject({ body: { projectId: data.projectId } });
      resultError = error;
    }
    if (type === 'resource') {
      const { error } = await getClient().deleteResource({ body: { resourceId: data.resourceId } });
      resultError = error;
    }
    if (type === 'resourceCollection') {
      const { error } = await getClient().bindProjectResources({ body: { ...data, operation: 'unbind' } });
      resultError = error;
    }

    setPopupVisible(false);

    if (resultError) {
      console.error(resultError);
      Message.error({ content: t('workspace.deleteDropdownMenu.failed') });
    } else {
      Message.success({ content: t('workspace.deleteDropdownMenu.successful') });
    }

    if (postDeleteList) {
      postDeleteList(data);
    }
  };

  const handleCancel = (e: MouseEvent) => {
    e.stopPropagation();
    setPopupVisible(false);
  };

  const handlEditKnowledgeBase = (e: MouseEvent) => {
    e.stopPropagation();
    importKnowledgeModal.setShowNewKnowledgeModal(true);
    importKnowledgeModal.setEditProject(data as Project);
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    setPopupVisible(!popupVisible);
  };

  const droplist = DropList({
    canCopy,
    type,
    position: deleteConfirmPosition,
    handleCancel,
    handleDeleteClick,
    handlEditKnowledgeBase,
    getPopupContainer,
  });

  return (
    <Dropdown
      position="br"
      popupVisible={popupVisible}
      droplist={droplist}
      triggerProps={{ onClickOutside: () => setPopupVisible(false) }}
      getPopupContainer={getPopupContainer}
    >
      <Button
        icon={<RiMoreFill style={{ fontSize: 16 }} />}
        type="text"
        onClick={(e) => handleIconClick(e)}
        className="text-gray-500 delete-button"
      ></Button>
    </Dropdown>
  );
};
