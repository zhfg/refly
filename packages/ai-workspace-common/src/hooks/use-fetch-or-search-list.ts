import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

export const useFetchOrSearchList = ({
  fetchData,
}: {
  fetchData?: (payload: { pageSize: number; page: number }) => Promise<{ success: boolean; data?: SearchResult[] }>;
}) => {
  const [mode, setMode] = useState<'fetch' | 'search'>('fetch');
  // fetch
  const { hasMore, setHasMore, loadMore, dataList, setDataList, currentPage, setCurrentPage, isRequesting } =
    useFetchDataList({
      fetchData,
    });

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
      loadMore();
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
