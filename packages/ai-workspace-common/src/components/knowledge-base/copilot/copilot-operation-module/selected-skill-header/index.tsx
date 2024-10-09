import { Button } from '@arco-design/web-react';
// styles
import './index.scss';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { useTranslation } from 'react-i18next';

export const SelectedSkillHeader = () => {
  const { t } = useTranslation();
  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstance: state.setSelectedSkillInstance,
  }));

  console.log('selectedSkill', skillStore?.selectedSkill);

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
          {t('copilot.selectedSkillHeader.title', {
            name: skillStore?.selectedSkill?.displayName,
          })}
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
