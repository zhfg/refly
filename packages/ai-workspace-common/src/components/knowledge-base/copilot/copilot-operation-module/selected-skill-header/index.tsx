import { Button } from '@arco-design/web-react';
// styles
import './index.scss';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';

export const SelectedSkillHeader = () => {
  const skillStore = useSkillStore();

  return skillStore?.selectedSkill ? (
    <div className="selected-skill">
      <div className="selected-skill-profile">
        <SkillAvatar
          size={20}
          shape="circle"
          icon={skillStore?.selectedSkill?.icon}
          displayName={skillStore?.selectedSkill?.displayName}
        />
        <p>
          和 <span className="selected-skill-name">{skillStore?.selectedSkill?.displayName}</span> 聊聊
        </p>
      </div>
      <div className="selected-skill-manage">
        <Button
          icon={<IconClose />}
          onClick={() => {
            skillStore.setSelectedSkillInstance(null);
          }}
        ></Button>
      </div>
    </div>
  ) : null;
};
