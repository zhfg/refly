import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import {} from '@heroicons/react/24/outline';
import { IconMessage } from '@arco-design/web-react/icon';

import './index.scss';
import { Item } from './item';

// request
import { SkillInstance, SkillMeta } from '@refly/openapi-schema';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useBigSearchQuickAction } from '@refly-packages/ai-workspace-common/hooks/use-big-search-quick-action';
import { useTranslation } from 'react-i18next';

export function Skill({
  activeValue,
  searchValue,
  selectedSkill,
  setValue,
}: {
  activeValue: string;
  searchValue: string;
  selectedSkill: SkillMeta;
  setValue: (val: string) => void;
}) {
  const searchStore = useSearchStore();
  const skillStore = useSkillStore();
  const { triggerSkillQuickAction } = useBigSearchQuickAction();
  const { t } = useTranslation();
  useEffect(() => {
    setValue(`refly-built-in-execute_${selectedSkill?.skillId}`);
  }, [selectedSkill?.skillId]);

  return (
    <>
      <Command.Group heading={t('loggedHomePage.quickSearch.home.heading')}>
        <Item
          value={`refly-built-in-execute_${selectedSkill?.skillId}`}
          keywords={[`execute_${selectedSkill?.displayName}`]}
          onSelect={() => {
            skillStore.setSelectedSkillInstance(selectedSkill as SkillInstance);
            triggerSkillQuickAction(searchValue);
            searchStore.setIsSearchOpen(false);
          }}
          activeValue={activeValue}
        >
          <IconMessage style={{ fontSize: 12 }} />
          {t('loggedHomePage.quickSearch.basedOn')}「 <span className="font-bold">{searchValue || '...'}</span> 」
          {t('loggedHomePage.quickSearch.execute')}{' '}
          <span className="font-bold" dangerouslySetInnerHTML={{ __html: selectedSkill?.displayName || '...' }}></span>
          {t('loggedHomePage.quickSearch.skill')}
        </Item>
      </Command.Group>
    </>
  );
}
