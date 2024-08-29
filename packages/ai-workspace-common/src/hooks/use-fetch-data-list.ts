import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message as message } from '@arco-design/web-react';

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

  // fetch
  const [dataList, setDataList] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const loadMore = async (page?: number) => {
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
  };

  const reload = async () => {
    try {
      setIsRequesting(true);
      const res = await fetchData({ pageSize, page: 1 });
      if (res?.success) {
        setDataList(res.data || []);
        setCurrentPage(2);
        setHasMore(res.data.length >= pageSize);
      }
    } catch (err) {
      console.error('重新加载数据失败', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const resetState = () => {
    setDataList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsRequesting(false);
  };

  return {
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
    resetState,
  };
};
