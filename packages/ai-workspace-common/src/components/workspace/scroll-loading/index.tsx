import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Skeleton } from '@arco-design/web-react';

export interface ScrollLoadingProps {
  isRequesting: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export const ScrollLoading = (props: ScrollLoadingProps) => {
  const { isRequesting, hasMore, loadMore } = props;

  const { t } = useTranslation();

  if (!hasMore) {
    return (
      <div className="w-full flex justify-center my-6">
        <span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>
      </div>
    );
  }

  if (isRequesting) {
    return (
      <div className="w-full flex flex-col mt-6">
        <Skeleton animation style={{ width: '100%' }}></Skeleton>
        <Skeleton animation style={{ width: '100%', marginTop: 24 }}></Skeleton>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center my-6">
      <Button onClick={() => loadMore()}>{t('common.loadMore')}</Button>
    </div>
  );
};
