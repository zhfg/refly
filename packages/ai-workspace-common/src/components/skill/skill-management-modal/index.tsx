import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { Modal, Button } from '@arco-design/web-react';
import { IconArrowRight } from '@arco-design/web-react/icon';

// 组件
import { SkillInstanceList } from '@refly-packages/ai-workspace-common/components/skill/skill-intance-list';
// 样式
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

export const SkillManagementModal = (props: any) => {
  const skillStore = useSkillStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onCancel = () => {
    skillStore.setSkillManagerModalVisible(false);
  };

  const goSkillList = () => {
    onCancel();
    navigate('/skill?tab=template');
  };

  return (
    <Modal
      visible={skillStore.skillManagerModalVisible}
      title="技能管理"
      getPopupContainer={() => {
        const elem = getPopupContainer();

        return elem;
      }}
      style={{ width: '80%', height: '80%' }}
      className="skill-management-modal-wrap"
      footer={null}
      onCancel={onCancel}
      escToExit
    >
      <div className="skill-management-modal">
        <div className="skill-management-modal__top-btn">
          <Button type="primary" style={{ borderRadius: 8 }} onClick={goSkillList}>
            <IconArrowRight />
            {t('skill.tab.skillTemplate')}
          </Button>
        </div>
        <SkillInstanceList />
      </div>
    </Modal>
  );
};
