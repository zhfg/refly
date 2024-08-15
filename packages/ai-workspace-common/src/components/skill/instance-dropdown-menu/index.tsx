import { IconDelete, IconMore, IconEdit } from '@arco-design/web-react/icon';
import { Dropdown, Menu, Button, Popconfirm, Message } from '@arco-design/web-react';
import { useState } from 'react';
// 类型
import { SkillInstance } from '@refly/openapi-schema';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

interface DropListProps {
  handleCancel: (e: any) => void;
  handlUpdateInstance: (e: any) => void;
  handleDeleteInstance?: (e: any) => void;
}

const DropList = (props: DropListProps) => {
  const { handleCancel, handlUpdateInstance, handleDeleteInstance } = props;
  const { t } = useTranslation();

  return (
    <Menu>
      <Menu.Item key="edit">
        <div onClick={(e) => handlUpdateInstance(e)}>
          <IconEdit style={iconStyle} />
          {t('common.edit')}
        </div>
      </Menu.Item>
      <Menu.Item key="delete">
        <Popconfirm
          focusLock
          title={t('common.deleteConfirmMessage')}
          position="br"
          onOk={(e) => {
            handleDeleteInstance(e);
          }}
          onCancel={(e) => {
            handleCancel(e);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <IconDelete style={iconStyle} />
            {t('common.delete')}
          </div>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );
};

interface InstanceDropdownMenuProps {
  postDeleteList?: (data: SkillInstance) => void;
  setUpdateModal: (val: boolean) => void;
  getSkillItemPopupContainer?: () => HTMLElement;
  data: SkillInstance;
}

export const InstanceDropdownMenu = (props: InstanceDropdownMenuProps) => {
  const { data, postDeleteList, setUpdateModal, getSkillItemPopupContainer } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();

  const handlUpdateInstance = (e: MouseEvent) => {
    e.stopPropagation();
    setUpdateModal(true);
  };

  const handleDeleteInstance = async (e: MouseEvent) => {
    e.stopPropagation();
    const { error } = await getClient().deleteSkillInstance({ body: { skillId: data.skillId } });
    setPopupVisible(false);

    if (error) {
      console.error(error);
      Message.error({ content: t('common.putError') });
    } else {
      Message.success({ content: t('common.putSuccess') });
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

  const droplist = DropList({ handleCancel, handlUpdateInstance, handleDeleteInstance });

  return (
    <Dropdown
      position="br"
      popupVisible={popupVisible}
      droplist={droplist}
      triggerProps={{ onClickOutside: () => setPopupVisible(false) }}
      getPopupContainer={getSkillItemPopupContainer}
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
