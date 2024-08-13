import { Avatar, Button, Popconfirm } from '@arco-design/web-react';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';

import { SkillItem } from './skill-item';

// 样式
import './index.scss';
import { SkillTemplate } from '@refly/openapi-schema';

export const SkillManagement = () => {
  const skillStore = useSkillStore();
  const { handleAddSkillInstance, handleRemoveSkillInstance } = useSkillManagement();

  const { skillInstances = [], skillTemplates = [] } = skillStore;
  const needInstallSkillInstance = true;

  const checkIsInstalled = (skill: SkillTemplate) => {
    const matchedSkill = skillInstances?.find((item) => item?.skillName === skill?.name);

    return !!matchedSkill;
  };

  return (
    <div className="skill-onboarding">
      <div className="skill-recommend-and-manage">
        <div className="skill-recommend-list">
          {skillTemplates.map((item, index) => (
            <SkillItem key={index} source="instance" data={item} isInstalled={checkIsInstalled(item)} />
          ))}
        </div>
      </div>
    </div>
  );
};
