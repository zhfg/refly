import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult } from '@refly/openapi-schema';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';
import { useEffect } from 'react';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const KnowledgeBasePopover = () => {
  const { setSelectedCollections } = useContextPanelStore((state) => ({
    setSelectedCollections: state.setSelectedCollections,
  }));
  const { loadMore, hasMore, dataList, isRequesting, currentPage, handleValueChange, mode, resetState } =
    useFetchOrSearchList({
      fetchData: async (queryPayload) => {
        const res = await getClient().listCollections({
          query: {
            ...queryPayload,
          },
        });

        const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
          id: item?.collectionId,
          title: item?.title,
          domain: 'collection',
        }));
        return { success: res?.data?.success, data };
      },
    });

  const updateSelectState = (data: SearchResult[]) => {
    setSelectedCollections(data);
  };

  return (
    <BasePopover
      content={
        <Content
          domain="collection"
          title="导入知识库"
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
