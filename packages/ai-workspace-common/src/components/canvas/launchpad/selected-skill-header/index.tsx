import { Button } from '@arco-design/web-react';
// styles
import './index.scss';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { useTranslation } from 'react-i18next';

interface SelectedSkillHeaderProps {
  // Add readonly and controlled props
  readonly?: boolean;
  skill?: {
    icon?: any;
    displayName?: string;
  };
  onClose?: () => void;
}

export const SelectedSkillHeader = ({ readonly, skill, onClose }: SelectedSkillHeaderProps) => {
  const { t } = useTranslation();
  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: skill ?? state.selectedSkill,
    setSelectedSkill: state.setSelectedSkill,
  }));

  const selectedSkill = skill ?? skillStore.selectedSkill;

  return selectedSkill ? (
    <div className="selected-skill">
      <div className="selected-skill-profile">
        <SkillAvatar size={20} shape="circle" icon={selectedSkill?.icon} displayName={selectedSkill?.displayName} />
        <p>{selectedSkill?.displayName}</p>
      </div>
      {!readonly && (
        <div className="selected-skill-manage">
          <Button
            icon={<IconClose />}
            onClick={() => {
              onClose?.();
              skillStore.setSelectedSkill(null);
            }}
          />
        </div>
      )}
    </div>
  ) : null;
};
