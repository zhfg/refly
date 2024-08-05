import { IconDelete, IconMore } from '@arco-design/web-react/icon';
import { Dropdown, Menu, Button, Popconfirm, Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
// 类型
import { Note, Collection } from '@refly/openapi-schema';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

interface DropListProps {
  type: string;
  handleCancel: (e: any) => void;
  handleDeleteClick: (e: any) => void;
}

const DropList = (props: DropListProps) => {
  const { handleCancel, handleDeleteClick, type } = props;
  const { t } = useTranslation();

  return (
    <Menu>
      <Menu.Item key="1">
        <Popconfirm
          focusLock
          title={t(
            `workspace.deleteDropdownMenu.deleteConfirmFor${type.replace(type[0], type[0].toLocaleUpperCase())}`,
          )}
          position="br"
          onOk={(e) => {
            handleDeleteClick(e);
          }}
          onCancel={(e) => {
            handleCancel(e);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <IconDelete style={iconStyle} />
            {t('workspace.deleteDropdownMenu.delete')}
          </div>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );
};

interface DeleteDropdownMenuProps {
  postDeleteList?: (note: Note | Collection) => void;
}

interface NotePros extends DeleteDropdownMenuProps {
  type: 'note';
  data: Note;
}

interface KnowledgeBasePros extends DeleteDropdownMenuProps {
  type: 'knowledgeBase';
  data: Collection;
}

export const DeleteDropdownMenu = (props: NotePros | KnowledgeBasePros) => {
  const { type, data, postDeleteList } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();

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

  const handleIconClick = (e) => {
    e.stopPropagation();
    setPopupVisible(!popupVisible);
  };

  const droplist = DropList({ handleCancel, handleDeleteClick, type });

  return (
    <Dropdown
      position="br"
      popupVisible={popupVisible}
      droplist={droplist}
      triggerProps={{ onClickOutside: () => setPopupVisible(false) }}
    >
      <Button
        icon={<IconMore style={{ fontSize: 16 }} />}
        type="text"
        onClick={(e) => handleIconClick(e)}
        className="text-gray-500"
      ></Button>
    </Dropdown>
  );
};
