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

  useEffect(() => {
    setValue(`refly-built-in-execute_${selectedSkill?.skillId}`);
  }, [selectedSkill?.skillId]);

  return (
    <>
      <Command.Group heading="建议">
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
          基于「 <span className="font-bold">{searchValue || '...'}</span> 」内容执行{' '}
          <span className="font-bold" dangerouslySetInnerHTML={{ __html: selectedSkill?.displayName || '...' }}></span>
          技能
        </Item>
      </Command.Group>
    </>
  );
}
