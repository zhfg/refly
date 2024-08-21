import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { DataFetcher, domainToFetchData } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';

export type ListMode = 'fetch' | 'search';

export const useFetchOrSearchList = ({
  domain,
  fetchData,
  pageSize = 10,
}: {
  domain?: SearchDomain;
  fetchData?: DataFetcher;
  pageSize?: number;
}) => {
  const [mode, setMode] = useState<ListMode>('fetch');

  if (!fetchData) {
    fetchData = domainToFetchData[domain];
    if (!fetchData) {
      throw new Error(`Domain ${domain} not supported`);
    }
  }

  // fetch
  const {
    hasMore,
    setHasMore,
    loadMore,
    dataList,
    setDataList,
    currentPage,
    setCurrentPage,
    isRequesting,
    resetState,
  } = useFetchDataList({
    fetchData,
    pageSize,
  });

  const debouncedSearch: ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => any =
    useDebouncedCallback(async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      try {
        const res = await getClient().search({
          body: {
            query: searchVal,
            scope: 'user',
            domains,
          },
        });

        const resData = res?.data?.data || [];

        setDataList(resData);
      } catch (err) {
        console.error('debounced search err: ', err);
      }
    }, 200);

  const handleValueChange = async (searchVal: string, domains: SearchDomain[]) => {
    if (!searchVal) {
      setDataList([]);
      setMode('fetch');
      loadMore();
    } else {
      setMode('search');
      debouncedSearch({
        searchVal,
        domains,
      });
      setHasMore(true);
      setCurrentPage(1);
    }
  };

  return {
    resetState,
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
