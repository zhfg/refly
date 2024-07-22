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
} from '@arco-design/web-react/icon';
import { useDebouncedCallback } from 'use-debounce';
import { defaultFilter } from './cmdk/filter';

import './index.scss';
import { Button, Modal } from '@arco-design/web-react';
import { Item } from './item';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchRequest, SearchResult } from '@refly/openapi-schema';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

export function DataList({
  domain,
  heading,
  icon,
  data,
  activeValue,
  displayMode,
}: {
  domain: string;
  heading: string;
  data: SearchResult[];
  icon: React.ReactNode;
  activeValue: string;
  displayMode: 'list' | 'search';
}) {
  const [stateDataList, setStateDataList] = useState<SearchResult[]>(data || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const { jumpToKnowledgeBase, jumpToNote, jumpToReadResource, jumpToConv } = useKnowledgeBaseJumpNewPath();

  const searchStore = useSearchStore();

  const fetchNewData = async (queryPayload: any): Promise<{ success: boolean; data?: SearchResult[] }> => {
    if (domain === 'skill') {
      const res = await getClient().listSkillInstances({
        query: {
          ...queryPayload,
        },
      });

      if (!res?.data?.success) return { success: false };
      const data = res?.data?.data?.map((item) => {
        return {
          id: item?.skillId,
          title: item?.skillDisplayName,
        } as SearchResult;
      });

      return { success: true, data };
    } else if (domain === 'note') {
      const res = await getClient().listResources({
        query: {
          ...queryPayload,
        },
      });

      if (!res?.data?.success) return { success: false };
      const data = res?.data?.data?.map((item) => {
        return {
          id: item?.resourceId,
          title: item?.title,
          content: [item?.content?.slice(0, 30) + '...'],
          metadata: {
            collectionId: item?.collectionId,
            resourceType: 'note',
          },
        } as SearchResult;
      });

      return { success: true, data };
    } else if (domain === 'readResources') {
      const res = await getClient().listResources({
        query: {
          ...queryPayload,
        },
      });

      if (!res?.data?.success) return { success: false };
      const data = res?.data?.data?.map((item) => {
        return {
          id: item?.resourceId,
          title: item?.title,
          content: [item?.content?.slice(0, 30) + '...'],
          metadata: {
            collectionId: item?.collectionId,
            resourceType: 'weblink',
          },
        } as SearchResult;
      });

      return { success: true, data };
    } else if (domain === 'knowledgeBases') {
      const res = await getClient().listCollections({
        query: {
          ...queryPayload,
        },
      });

      if (!res?.data?.success) return { success: false };
      const data = res?.data?.data?.map((item) => {
        return {
          id: item?.collectionId,
          title: item?.title,
          content: [item?.description?.slice(0, 30) + '...'],
        } as SearchResult;
      });

      return { success: true, data };
    } else if (domain === 'convs') {
      const res = await getClient().listConversations({
        query: {
          ...queryPayload,
        },
      });

      if (!res?.data?.success) return { success: false };
      const data = res?.data?.data?.map((item) => {
        return {
          id: item?.convId,
          title: item?.title,
          content: [item?.lastMessage?.slice(0, 30) + '...'],
        } as SearchResult;
      });

      return { success: true, data };
    }
  };

  const loadMore = async (currentPage?: number) => {
    if (isRequesting || !hasMore) return;

    // 获取数据
    const queryPayload = {
      pageSize: 10,
      page: currentPage + 1,
    };

    // 更新页码
    setCurrentPage(currentPage + 1);
    setIsRequesting(true);

    const res = await fetchNewData(queryPayload);
    console.log('res', res);

    if (!res?.success) {
      setIsRequesting(false);

      return;
    }

    // 处理分页
    if (res?.data?.length < 10) {
      setHasMore(false);
    }

    console.log('res', res);
    setStateDataList([...stateDataList, ...(res?.data || [])]);
    setIsRequesting(false);
  };

  useEffect(() => {
    setStateDataList(data);
  }, [data]);

  return (
    <>
      {stateDataList?.map((item, index) => (
        <Item
          key={index}
          value={`${domain}-${index}-${item?.title}-${item?.content?.[0] || ''}`}
          activeValue={activeValue}
          onSelect={() => {
            if (domain === 'skill') {
            } else if (domain === 'note') {
              jumpToNote({
                noteId: item?.id,
              });
            } else if (domain === 'readResources') {
              jumpToReadResource({
                kbId: item?.metadata?.collectionId,
                resId: item?.id,
              });
            } else if (domain === 'knowledgeBases') {
              jumpToKnowledgeBase({
                kbId: item?.id,
              });
            } else if (domain === 'convs') {
              jumpToConv({
                convId: item?.id,
              });
            }

            searchStore.setIsSearchOpen(false);
          }}
        >
          {icon}
          <div className="search-res-container">
            <p className="search-res-title" dangerouslySetInnerHTML={{ __html: item?.title }}></p>
            {item?.content?.length > 0 && (
              <p className="search-res-desc" dangerouslySetInnerHTML={{ __html: item?.content?.[0] || '' }}></p>
            )}
          </div>
        </Item>
      ))}
      {hasMore && displayMode === 'list' ? (
        <div className="search-load-more">
          <Button type="text" loading={isRequesting} onClick={() => loadMore(currentPage)}>
            加载更多
          </Button>
        </div>
      ) : null}
    </>
  );
}
