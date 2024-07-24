import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import * as Popover from '@radix-ui/react-popover';
import { Logo, LinearIcon, FigmaIcon, SlackIcon, YouTubeIcon, RaycastIcon } from './icons';
import {} from '@heroicons/react/24/outline';
import {
  IconSearch,
  IconMessage,
  IconFile,
  IconApps,
  IconBook,
  IconEdit,
  IconRobot,
  IconFolderAdd,
} from '@arco-design/web-react/icon';
import { useDebouncedCallback } from 'use-debounce';
import { defaultFilter } from './cmdk/filter';

import './index.scss';
import { Button, Modal } from '@arco-design/web-react';
import { Item } from './item';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchRequest, SearchResult, SkillInstance, SkillMeta } from '@refly/openapi-schema';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
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
  const { jumpToKnowledgeBase, jumpToNote, jumpToReadResource, jumpToConv } = useKnowledgeBaseJumpNewPath();

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
          keywords={[`execute_${selectedSkill?.skillDisplayName}`]}
          onSelect={() => {
            skillStore.setSelectedSkillInstalce(selectedSkill as SkillInstance);
            triggerSkillQuickAction(searchValue);
            searchStore.setIsSearchOpen(false);
          }}
          activeValue={activeValue}
        >
          <IconMessage style={{ fontSize: 12 }} />
          基于「 <span className="font-bold">{searchValue || '...'}</span> 」内容执行{' '}
          <span
            className="font-bold"
            dangerouslySetInnerHTML={{ __html: selectedSkill?.skillDisplayName || '...' }}
          ></span>
          技能
        </Item>
      </Command.Group>
    </>
  );
}
