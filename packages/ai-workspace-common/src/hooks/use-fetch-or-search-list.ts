import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export const useFetchOrSearchList = ({
  fetchData,
}: {
  fetchData?: (payload: { pageSize: number; page: number }) => Promise<{ success: boolean; data?: SearchResult[] }>;
}) => {
  const [mode, setMode] = useState<'fetch' | 'search'>('fetch');
  // fetch
  const [dataList, setDataList] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const loadMore = async (currentPage?: number, mode?: 'fetch' | 'search') => {
    if (isRequesting || !hasMore) return;

    // 获取数据
    const queryPayload = {
      pageSize: 10,
      page: currentPage + 1,
    };

    try {
      setIsRequesting(true);
      setCurrentPage(currentPage + 1);

      const res = await fetchData(queryPayload);

      if (!res?.success) {
        setIsRequesting(false);

        return;
      }

      // 处理分页
      if (res?.data?.length < 10) {
        setHasMore(false);
      }

      if (currentPage === 0) {
        setDataList([...(res?.data || [])]);
      } else {
        setDataList([...dataList, ...(res?.data || [])]);
      }
      setIsRequesting(false);
    } catch (err) {
      console.log('fetch data list error', err);
      setIsRequesting(false);
    }
  };

  const debouncedSearch: ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => any =
    useDebouncedCallback(async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      try {
        const res = await getClient().search({
          body: {
            query: searchVal,
            scope: 'user',
            domains: domains,
          },
        });

        const resData = res?.data?.data || [];

        console.log('resData', resData);
        setDataList(resData);
      } catch (err) {
        console.log('big search err: ', err);
      }
    }, 200);

  const handleValueChange = async (searchVal: string) => {
    if (!searchVal) {
      setDataList([]);
      setMode('fetch');
      loadMore(0);
    } else {
      setMode('search');
      debouncedSearch({
        searchVal,
        domains: ['collection'],
      });
      setHasMore(true);
      setCurrentPage(1);
    }
  };

  return {
    mode,
    setMode,
    hasMore,
    loadMore,
    dataList,
    currentPage,
    isRequesting,
    debouncedSearch,
    handleValueChange,
  };
};
