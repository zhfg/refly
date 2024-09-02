import { useState } from 'react';
import { Avatar, Button, Typography, Message as message, Tooltip } from '@arco-design/web-react';
import { InstanceDropdownMenu } from '@refly-packages/ai-workspace-common/components/skill/instance-dropdown-menu';
import { NewSkillInstanceModal } from '@refly-packages/ai-workspace-common/components/skill/new-instance-modal';

import { HiOutlinePlay } from 'react-icons/hi2';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// 样式
import './index.scss';
import { SkillInstance } from '@refly/openapi-schema';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InstanceInvokeModal } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-modal';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillInstanceListSource } from '@refly-packages/ai-workspace-common/components/skill/skill-intance-list';

interface InstanceItemProps {
  data: SkillInstance;
  itemKey: number;
  canGoDetail?: boolean;
  source?: SkillInstanceListSource;
  refreshList?: () => void;
  postDeleteList?: (data: SkillInstance) => void;
}

export const InstanceItem = (props: InstanceItemProps) => {
  const navigate = useNavigate();
  const setSelectedSkillInstalce = useSkillStore((state) => state.setSelectedSkillInstalce);
  const setSkillManagerModalVisible = useSkillStore((state) => state.setSkillManagerModalVisible);

  const { data, itemKey, canGoDetail, source, refreshList, postDeleteList } = props;
  const { t } = useTranslation();

  const getInstanceItemPopupContainer = () => {
    const elem = document.getElementById(`instanceItem${itemKey}`);

    return elem as HTMLElement;
  };

  const goSkillDetail = () => {
    const { skillId } = data;

    // click from skill-management-modal, set selectedSkill for copilot
    if (source === 'skill-management-modal') {
      setSelectedSkillInstalce(data);
      setSkillManagerModalVisible(false);
      return;
    }

    if (source === 'template' || !skillId || !canGoDetail) {
      return;
    }
    navigate(`/skill-detail?skillId=${skillId}`);
  };

  const handlePinSkill = async () => {
    const { error } = await getClient()[data.pinnedAt ? 'unpinSkillInstance' : 'pinSkillInstance']({
      body: { skillId: data.skillId },
    });
    if (error) {
      message.error(t('common.putErr'));
    } else {
      message.success(t('common.putSuccess'));
      if (refreshList) {
        refreshList();
      }
    }
  };

  const handleTopSkill = (e) => {
    e.stopPropagation();

    handlePinSkill();
  };

  const [visible, setVisible] = useState(false);
  const [invokeModalVisible, setInvokeModalVisible] = useState(false);
  const handleClickInvoke = (e) => {
    e.stopPropagation();
    setInvokeModalVisible(true);
  };

  return (
    <div id={`instanceItem${itemKey}`}>
      <div
        className={`instance-item ${source === 'skill-management-modal' ? 'instance-item-management' : ''} ${
          data.pinnedAt && source === 'skill-management-modal' ? 'instance-item-pinned' : ''
        }`}
        onClick={goSkillDetail}
      >
        <div className="instance-item__header">
          <div className="instance-item__profile">
            <Avatar size={40} shape="square" style={{ backgroundColor: '#00d0b6', borderRadius: 8 }}>
              {data?.displayName}
            </Avatar>
          </div>
          <div className="instance-item__title">
            <div className="instance-item__title-name">{data?.displayName}</div>
            {/* <div className="instance-item__title-info">
              <span className="instance-item__title-info-item">
                <IconUser /> 99
              </span>
              <Divider type="vertical" />
              <span className="instance-item__title-info-item">
                <IconPlayCircle /> 1k
              </span>
            </div> */}
          </div>
        </div>

        {source !== 'skill-management-modal' && (
          <div className="instance-item__desc">
            <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ lineHeight: 1.51 }}>
              {data?.description}
            </Typography.Paragraph>
          </div>
        )}

        <div className="instance-item__action">
          <Button
            icon={<HiOutlinePlay />}
            type="text"
            onClick={(e) => handleClickInvoke(e)}
            className="instance-item__action-icon"
          ></Button>

          {source === 'skill-management-modal' && (
            <Tooltip
              content={data.pinnedAt ? t('skill.skillManagement.removeFromTop') : t('skill.skillManagement.addToTop')}
            >
              <Button
                className="instance-item__action-icon"
                type="text"
                icon={data.pinnedAt ? <BsPinAngleFill /> : <BsPinAngle />}
                onClick={(e) => handleTopSkill(e)}
              />
            </Tooltip>
          )}

          <InstanceDropdownMenu
            data={data}
            setUpdateModal={(val) => setVisible(val)}
            postDeleteList={postDeleteList}
            getPopupContainer={getInstanceItemPopupContainer}
          />
        </div>
      </div>
      <NewSkillInstanceModal
        type="update"
        instance={data}
        visible={visible}
        setVisible={(val) => setVisible(val)}
        postConfirmCallback={refreshList}
      />
      <InstanceInvokeModal visible={invokeModalVisible} setVisible={(val) => setInvokeModalVisible(val)} data={data} />
    </div>
  );
};
