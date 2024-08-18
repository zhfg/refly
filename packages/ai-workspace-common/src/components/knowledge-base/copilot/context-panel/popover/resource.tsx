import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useEffect } from 'react';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';

export const ResourcePopover = () => {
  const { setSelectedResources } = useContextPanelStore((state) => ({
    setSelectedResources: state.setSelectedResources,
  }));
  const { loadMore, hasMore, dataList, isRequesting, currentPage, handleValueChange, mode, resetState } =
    useFetchOrSearchList({
      fetchData: async (queryPayload) => {
        const res = await getClient().listResources({
          query: {
            ...queryPayload,
            resourceType: 'weblink',
          },
        });

        const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
          id: item?.resourceId,
          title: item?.title,
          domain: 'resource',
          metadata: { collectionId: item?.collectionId, resourceType: 'weblink' },
        }));
        return { success: res?.data?.success, data };
      },
    });

  const updateSelectState = (data: SearchResult[]) => {
    setSelectedResources(data);
  };

  return (
    <BasePopover
      content={
        <Content
          domain="resource"
          title="导入资源"
          searchPlaceholder="搜索知识库"
          updateSelectState={updateSelectState}
          handleValueChange={handleValueChange}
          mode={mode}
          hasMore={hasMore}
          isRequesting={isRequesting}
          currentPage={currentPage}
          loadMore={loadMore}
          dataList={dataList}
          resetState={resetState}
          renderTitle={({ title }) => {
            return <span dangerouslySetInnerHTML={{ __html: title }}></span>;
          }}
        />
      }
    >
      <div className="context-tree-node-extra">
        <Button type="text" className="context-tree-node-extra-btn">
          <span>添加</span>
        </Button>
      </div>
    </BasePopover>
  );
};
