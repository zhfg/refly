import { IconSettings } from '@arco-design/web-react/icon';
import { useResizeBox } from '@refly-packages/ai-workspace-common/hooks/use-resize-box';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { memo, useEffect, useRef } from 'react';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
import { useTranslation } from 'react-i18next';

export const SkillDisplay = memo(({ source }: { source: string }) => {
  const skillStore = useSkillStore((state) => ({
    skillInstances: state.skillInstances,
    setSelectedSkillInstance: state.setSelectedSkillInstance,
    setSkillManagerModalVisible: state.setSkillManagerModalVisible,
  }));

  const { t } = useTranslation();

  const skillDisplayRef = useRef<HTMLDivElement>(null);

  const [containCnt, updateContainCnt] = useResizeBox({
    getGroupSelector: () => skillDisplayRef.current,
    getResizeSelector: () => getPopupContainer().querySelectorAll('.skill-item') as NodeListOf<HTMLElement>,
    initialContainCnt: 3,
    paddingSize: 0,
    placeholderWidth: 95,
  });

  const { handleGetSkillInstances, handleGetSkillTemplates } = useSkillManagement();

  const isFromSkillJob = () => {
    return source === 'skillJob';
  };

  useEffect(() => {
    if (isFromSkillJob()) return;
    handleGetSkillInstances();
  }, []);

  useEffect(() => {
    if (skillStore.skillInstances.length > 0) {
      setTimeout(() => {
        updateContainCnt();
      }, 0);
    }
  }, [skillStore.skillInstances]);

  return (
    <div className="skill-container" ref={skillDisplayRef}>
      {skillStore?.skillInstances?.map((item, index) => (
        <div
          key={index}
          className={`skill-item ${index >= containCnt ? 'hide' : ''}`}
          onClick={() => {
            skillStore.setSelectedSkillInstance(item);
          }}
        >
          <SkillAvatar noBorder size={20} icon={item?.icon} displayName={item?.displayName} background="transparent" />
          <span className="skill-item-title">{item?.displayName}</span>
        </div>
      ))}
      <div
        key="more"
        className="skill-item"
        onClick={() => {
          skillStore.setSkillManagerModalVisible(true);
        }}
      >
        <IconSettings /> <p className="skill-title skill-item-title">{t('copilot.skillDisplay.manager')}</p>
      </div>
    </div>
  );
});
