import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message as message } from '@arco-design/web-react';
import { create } from 'zustand';

interface FetchDataListState {
  isRequesting: boolean;
  hasMore: boolean;
  currentPage: number;
  dataList: any[];
  setDataList: (dataList: any[]) => void;
  setCurrentPage: (currentPage: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setIsRequesting: (isRequesting: boolean) => void;
}

const useFetchDataListStore = create<FetchDataListState>((set) => ({
  isRequesting: false,
  hasMore: true,
  currentPage: 1,
  dataList: [],

  setIsRequesting: (isRequesting: boolean) => set({ isRequesting }),
  setHasMore: (hasMore: boolean) => set({ hasMore }),
  setCurrentPage: (currentPage: number) => set({ currentPage }),
  setDataList: (dataList: any[]) => set({ dataList }),
}));

export const useFetchDataList = <T = any>({
  fetchData,
  pageSize = 10,
  showErrMsg = true,
}: {
  fetchData: (payload: { pageSize: number; page: number }) => Promise<{ success: boolean; data?: T[] }>;
  pageSize?: number;
  showErrMsg?: boolean;
}) => {
  const { t } = useTranslation();

  const { dataList, setDataList, currentPage, setCurrentPage, hasMore, setHasMore, isRequesting, setIsRequesting } =
    useFetchDataListStore();

  // fetch

  const resetState = () => {
    setDataList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsRequesting(false);
  };

  const loadMore = useCallback(
    async (page?: number) => {
      const { isRequesting, hasMore, currentPage, dataList } = useFetchDataListStore.getState();
      if (isRequesting || !hasMore) return;

      // 获取数据
      const queryPayload = {
        pageSize,
        page: page ?? currentPage,
      };

      try {
        setIsRequesting(true);
        setCurrentPage(currentPage + 1);

        const res = await fetchData(queryPayload);

        if (!res?.success) {
          setIsRequesting(false);

          return;
        }

        // If this page contains fewer data than pageSize, it is the last page
        if (res?.data?.length < pageSize) {
          setHasMore(false);
        }

        if (currentPage === 0) {
          setDataList([...(res?.data || [])]);
        } else {
          setDataList([...dataList, ...(res?.data || [])]);
        }
      } catch (err) {
        console.error('fetch data list error', err);
        if (showErrMsg) {
          message.error(t('knowledgeLibrary.archive.list.fetchErr'));
        }
      } finally {
        setIsRequesting(false);
      }
    },
    [isRequesting, hasMore],
  );

  const reload = async () => {
    setHasMore(true);
    setCurrentPage(1);
    // 获取数据
    const queryPayload = {
      pageSize,
      page: 1,
    };
    try {
      setIsRequesting(true);
      setCurrentPage(2);

      const res = await fetchData(queryPayload);

      if (!res?.success) {
        setIsRequesting(false);

        return;
      }

      // If this page contains fewer data than pageSize, it is the last page
      if (res?.data?.length < pageSize) {
        setHasMore(false);
      }
      setDataList([...(res?.data || [])]);
    } catch (err) {
      console.error('fetch data list error', err);
      if (showErrMsg) {
        message.error(t('knowledgeLibrary.archive.list.fetchErr'));
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    resetState,
    hasMore,
    setHasMore,
    dataList,
    setDataList,
    currentPage,
    setCurrentPage,
    isRequesting,
    setIsRequesting,
    loadMore,
    reload,
  };
};
