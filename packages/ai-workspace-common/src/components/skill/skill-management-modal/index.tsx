import { useState, useEffect } from 'react';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useHandleTopSkills } from '@refly-packages/ai-workspace-common/stores/handle-top-skills';
import { Modal } from '@arco-design/web-react';

// 组件
import { SkillInstanceList } from '@refly-packages/ai-workspace-common/components/skill/skill-intance-list';

// 样式
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { SkillInstance } from '@refly/openapi-schema';

export const SkillManagementModal = (props: any) => {
  const skillStore = useSkillStore();
  const [topSkills, setTopSkills] = useState<SkillInstance[]>([]);
  const handleTopSkills = useHandleTopSkills();

  useEffect(() => {
    if (skillStore.skillManagerModalVisible || handleTopSkills.shouldUpdate) {
      const storedTopSkills = JSON.parse(localStorage.getItem('topSkills') || '[]');
      setTopSkills(storedTopSkills);
      handleTopSkills.setShouldUpdate(false);
    }
  }, [skillStore.skillManagerModalVisible, handleTopSkills.shouldUpdate]);

  const onCancel = () => {
    skillStore.setSkillManagerModalVisible(false);
  };

  return (
    <Modal
      visible={skillStore.skillManagerModalVisible}
      title="技能管理"
      getPopupContainer={() => {
        const elem = getPopupContainer();

        return elem;
      }}
      style={{ width: '80vw', height: '80vh' }}
      className="skill-management-modal-wrap"
      footer={null}
      onCancel={onCancel}
      escToExit
    >
      <div className="skill-management-modal">
        {topSkills.length > 0 ? (
          <div className="skill-management-modal-top">
            <SkillInstanceList isTopSkill={true} topSkillList={topSkills} source="skill-management-modal" />
          </div>
        ) : null}
        <SkillInstanceList source="skill-management-modal" />
      </div>
    </Modal>
  );
};
