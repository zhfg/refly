import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import * as Popover from '@radix-ui/react-popover';
import {} from '@heroicons/react/24/outline';
import { IconMessage, IconApps, IconFolderAdd } from '@arco-design/web-react/icon';
import { useDebouncedCallback } from 'use-debounce';

import './index.scss';
import { Item } from './item';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchRequest, SearchResult } from '@refly/openapi-schema';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useBigSearchQuickAction } from '@refly-packages/ai-workspace-common/hooks/use-big-search-quick-action';
import { RenderItem } from '../../types/item';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

export function Home({
  // pages,
  // setPages,
  displayMode,
  data,
  activeValue,
  searchValue,
  setValue,
  showItemDetail,
}: {
  data: RenderItem[];
  // pages: string[];
  // setPages: (pages: string[]) => void;
  displayMode: 'list' | 'search';
  activeValue: string;
  searchValue: string;
  setValue: (val: string) => void;
  showItemDetail: boolean;
}) {
  const navigate = useNavigate();
  const searchStore = useSearchStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpToKnowledgeBase, jumpToNote, jumpToReadResource } = useKnowledgeBaseJumpNewPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const { triggerSkillQuickAction } = useBigSearchQuickAction();
  const skillStore = useSkillStore();
  const { t } = useTranslation();

  useEffect(() => {
    setValue('refly-built-in-ask-ai');
  }, []);

  return (
    <>
      {data?.map((item, index) => (
        <Item
          key={index}
          className={classNames(item?.data?.isSelected ? 'selected' : '', 'search-res-item')}
          value={`${item?.data?.title}__${item?.data?.id}`}
          activeValue={activeValue}
          onSelect={() => {
            item?.onItemClick(item?.data);
          }}
        >
          <span className="search-res-icon">{item?.icon}</span>
          <div className="search-res-container">
            <p
              className="search-res-title"
              dangerouslySetInnerHTML={{ __html: item?.data?.title }}
              title={item?.data?.title.replace(/<[^>]*>/g, '')}
            ></p>
          </div>
        </Item>
      ))}
    </>
  );
}
