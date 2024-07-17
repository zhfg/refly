import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { Modal } from '@arco-design/web-react';

// 组件
import { SkillManagement } from '@refly-packages/ai-workspace-common/components/skill/skill-management';
// 样式
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

export const SkillManagementModal = (props: any) => {
  const skillStore = useSkillStore();

  return (
    <Modal
      visible={skillStore.skillManagerModalVisible}
      title="技能管理"
      getPopupContainer={() => {
        const elem = getPopupContainer();

        return elem;
      }}
      style={{ width: '80%', minHeight: '80vh' }}
      footer={null}
      onCancel={() => {
        skillStore.setSkillManagerModalVisible(false);
      }}
      escToExit
    >
      <div style={{ height: '100%' }}>
        <SkillManagement />
      </div>
    </Modal>
  );
};
