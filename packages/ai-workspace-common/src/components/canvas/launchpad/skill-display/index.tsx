import { IconDown } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { useRef, useMemo, useCallback } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useListSkills } from '@refly-packages/ai-workspace-common/queries';
import { Skill, SearchDomain } from '@refly-packages/ai-workspace-common/requests/types.gen';

export const SkillDisplay = () => {
  const { t } = useTranslation();
  const skillStore = useSkillStoreShallow((state) => ({
    setSelectedSkill: state.setSelectedSkill,
    setSkillManagerModalVisible: state.setSkillManagerModalVisible,
  }));

  const skillDisplayRef = useRef<HTMLDivElement>(null);
  const containCnt = 4;

  const { data } = useListSkills({}, [], {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const skills = useMemo(() => data?.data, [data?.data]);

  const handleSkillSelect = useCallback(
    (skill: Skill) => {
      skillStore.setSelectedSkill(skill);
    },
    [skillStore.setSelectedSkill],
  );

  const handleSkillManagerOpen = useCallback(() => {
    skillStore.setSkillManagerModalVisible(true);
  }, [skillStore.setSkillManagerModalVisible]);

  const handleSearchListConfirm = useCallback(
    (items: any[]) => {
      skillStore.setSelectedSkill(items[0].metadata?.originalItem as Skill);
    },
    [skillStore.setSelectedSkill],
  );

  const skillItems = useMemo(() => {
    return skills?.map((item, index) => {
      const displayName = t(`${item?.name}.name`, { ns: 'skill' });
      return (
        <div
          key={item?.name || index}
          className={`skill-item ${index >= containCnt ? 'hide' : ''}`}
          onClick={() => handleSkillSelect(item)}
        >
          <SkillAvatar noBorder size={20} icon={item?.icon} displayName={displayName} background="transparent" />
          <span className="skill-item-title">{displayName}</span>
        </div>
      );
    });
  }, [skills, containCnt, handleSkillSelect, t]);

  const searchListComponent = useMemo(
    () => (
      <SearchList
        domain={'skill' as SearchDomain}
        trigger="hover"
        mode="single"
        handleConfirm={handleSearchListConfirm}
      >
        <div key="more" className="skill-item group" onClick={handleSkillManagerOpen}>
          <IconDown className="transform transition-transform duration-300 ease-in-out group-hover:rotate-180" />
        </div>
      </SearchList>
    ),
    [handleSearchListConfirm, handleSkillManagerOpen],
  );

  return (
    <div className="skill-container" ref={skillDisplayRef}>
      {skillItems}
      {searchListComponent}
    </div>
  );
};
