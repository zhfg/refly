import { useEffect } from 'react';
import { Spin, Empty } from 'antd';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { useTranslation } from 'react-i18next';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

interface TemplateListProps {
  language: string;
  categoryId: string;
}
export const TemplateList = ({ language, categoryId }: TemplateListProps) => {
  const { t } = useTranslation();
  const { dataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCanvasTemplates({
        query: {
          language,
          categoryId: categoryId === 'my-templates' ? null : categoryId,
          scope: categoryId === 'my-templates' ? 'private' : 'public',
          ...queryPayload,
        },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    reload();
  }, [language, categoryId]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <Spin className="spin" spinning={isRequesting}>
        {isRequesting || dataList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {dataList.map((item) => (
                <div key={item.templateId}>{item.title}</div>
              ))}
            </div>
            <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty description={t('common.empty')} />
          </div>
        )}
      </Spin>
    </div>
  );
};
