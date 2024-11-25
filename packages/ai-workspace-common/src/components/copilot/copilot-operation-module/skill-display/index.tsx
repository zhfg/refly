import { IconDown } from '@arco-design/web-react/icon';
import { useResizeBox } from '@refly-packages/ai-workspace-common/hooks/use-resize-box';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { memo, useEffect, useRef, useState } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useListSkills } from '@refly/openapi-schema/queries';

export const SkillDisplay = memo(({ source }: { source: string }) => {
  const skillStore = useSkillStoreShallow((state) => ({
    setSelectedSkill: state.setSelectedSkill,
    setSkillManagerModalVisible: state.setSkillManagerModalVisible,
  }));

  const skillDisplayRef = useRef<HTMLDivElement>(null);

  const [containCnt, updateContainCnt] = useResizeBox({
    getGroupSelector: () => skillDisplayRef.current,
    getResizeSelector: () => getPopupContainer().querySelectorAll('.skill-item') as NodeListOf<HTMLElement>,
    initialContainCnt: 3,
    paddingSize: 0,
    placeholderWidth: 95,
  });

  const { data } = useListSkills();
  const { data: skills } = data || {};

  useEffect(() => {
    if (skills?.length > 0) {
      setTimeout(() => {
        updateContainCnt();
      }, 0);
    }
  }, [skills]);

  return (
    <div className="skill-container" ref={skillDisplayRef}>
      {skills?.map((item, index) => (
        <div
          key={index}
          className={`skill-item ${index >= containCnt ? 'hide' : ''}`}
          onClick={() => {
            skillStore.setSelectedSkill(item);
          }}
        >
          <SkillAvatar noBorder size={20} icon={item?.icon} displayName={item?.displayName} background="transparent" />
          <span className="skill-item-title">{item?.displayName}</span>
        </div>
      ))}

      <SearchList domain={'skill'} trigger="hover" mode="single">
        <div
          key="more"
          className={`skill-item group`}
          onClick={() => {
            skillStore.setSkillManagerModalVisible(true);
          }}
        >
          <IconDown className="transform transition-transform duration-300 ease-in-out group-hover:rotate-180" />
        </div>
      </SearchList>
    </div>
  );
});
