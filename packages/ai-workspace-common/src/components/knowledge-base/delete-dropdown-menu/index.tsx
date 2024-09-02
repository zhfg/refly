import { RiDeleteBinLine, RiMoreFill } from 'react-icons/ri';
import { TbEdit } from 'react-icons/tb';
import { Dropdown, Menu, Button, Popconfirm, Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
// 类型
import { Note, Collection, Resource, RemoveResourceFromCollectionRequest } from '@refly/openapi-schema';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';
import { useImportKnowledgeModal } from '@refly-packages/ai-workspace-common/stores/import-knowledge-modal';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(3px)',
};

type positionType = 'left' | 'tr' | 'br' | 'tl' | 'bl' | 'top' | 'bottom' | 'right' | 'lb' | 'rb' | 'lt' | 'rt';

interface DropListProps {
  type: string;
  position?: positionType;
  handleCancel: (e: any) => void;
  handleDeleteClick: (e: any) => void;
  handlEditKnowledgeBase?: (e: any) => void;
  getPopupContainer?: () => HTMLElement;
}

const DropList = (props: DropListProps) => {
  const { handleCancel, handleDeleteClick, handlEditKnowledgeBase, type, getPopupContainer, position } = props;
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
      <Menu.Item key="delete">
        <Popconfirm
          focusLock
          getPopupContainer={getPopupContainer}
          title={t(`common.deleteConfirmMessage`)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          position={position || 'br'}
          onOk={(e) => {
            handleDeleteClick(e);
          }}
          onCancel={(e) => {
            handleCancel(e);
          }}
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
  postDeleteList?: (note: Note | Collection | Resource | RemoveResourceFromCollectionRequest) => void;
  getPopupContainer?: () => HTMLElement;
  deleteConfirmPosition?: positionType;
}

interface NotePros extends DeleteDropdownMenuProps {
  type: 'note';
  data: Note;
}

interface KnowledgeBasePros extends DeleteDropdownMenuProps {
  type: 'knowledgeBase';
  data: Collection;
}

interface ResourcePros extends DeleteDropdownMenuProps {
  type: 'resource';
  data: Resource;
}

interface ResourceCollectionPros extends DeleteDropdownMenuProps {
  type: 'resourceCollection';
  data?: RemoveResourceFromCollectionRequest;
}

export const DeleteDropdownMenu = (props: NotePros | KnowledgeBasePros | ResourcePros | ResourceCollectionPros) => {
  const { type, data, postDeleteList, getPopupContainer, deleteConfirmPosition } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();

  const importKnowledgeModal = useImportKnowledgeModal();

  const handleDeleteClick = async (e: MouseEvent) => {
    e.stopPropagation();
    let resultError: unknown;
    if (type === 'note') {
      const { error } = await getClient().deleteNote({ body: { noteId: data.noteId } });
      resultError = error;
    }
    if (type === 'knowledgeBase') {
      const { error } = await getClient().deleteCollection({ body: { collectionId: data.collectionId } });
      resultError = error;
    }
    if (type === 'resource') {
      const { error } = await getClient().deleteResource({ body: { resourceId: data.resourceId } });
      resultError = error;
    }
    if (type === 'resourceCollection') {
      const { error } = await getClient().removeResourceFromCollection({ body: { ...data } });
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
    importKnowledgeModal.setEditCollection(data);
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    setPopupVisible(!popupVisible);
  };

  const droplist = DropList({
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
