import { Button } from 'antd';
// styles
import './index.scss';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { useTranslation } from 'react-i18next';
import { Skill } from '@refly/openapi-schema';
import classNames from 'classnames';

interface SelectedSkillHeaderProps {
  // Add readonly and controlled props
  readonly?: boolean;
  skill?: Skill;
  onClose?: () => void;
  // Add className prop
  className?: string;
}

export const SelectedSkillHeader = ({ readonly, skill, onClose, className }: SelectedSkillHeaderProps) => {
  const { t } = useTranslation();
  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: skill ?? state.selectedSkill,
    setSelectedSkill: state.setSelectedSkill,
  }));

  const selectedSkill = skill ?? skillStore.selectedSkill;
  const skillDisplayName = selectedSkill ? t(`${selectedSkill?.name}.name`, { ns: 'skill' }) : '';

  return selectedSkill ? (
    <div className={classNames('selected-skill', className)}>
      <div className="selected-skill-profile">
        <SkillAvatar size={20} shape="circle" icon={selectedSkill?.icon} displayName={skillDisplayName} />
        <p>{skillDisplayName}</p>
      </div>
      {!readonly && (
        <div className="selected-skill-manage">
          <Button
            type="text"
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
