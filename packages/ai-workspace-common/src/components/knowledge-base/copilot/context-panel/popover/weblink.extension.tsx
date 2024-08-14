import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { memo, useEffect } from 'react';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const WeblinkPopover = memo(() => {
  const { setSelectedWeblinks } = useContextPanelStore((state) => ({
    setSelectedWeblinks: state.setSelectedWeblinks,
  }));
  const { loadMore, dataList, isRequesting, currentPage, handleValueChange, mode, resetState } = useFetchOrSearchList({
    fetchData: async (queryPayload) => {
      console.log('load more welink');
      const res = (await sendMessage({
        name: 'getOpenedTabs',
        type: 'getOpenedTabs',
        source: getRuntime(),
      })) as {
        tabs: {
          id: string;
          title: string;
          url: string;
        }[];
      };

      console.log('res', res);
      const data: SearchResult[] = (res?.tabs || []).map((item) => ({
        id: item?.id,
        title: item?.title,
        domain: 'weblink' as SearchDomain,
      }));
      return { success: true, data };
    },
  });

  const updateSelectState = (data: SearchResult[]) => {
    setSelectedWeblinks(data);
  };

  return (
    <BasePopover
      content={
        <Content
          domain="weblink"
          title="从打开的浏览器页面添加"
          searchPlaceholder="搜索打开页面"
          updateSelectState={updateSelectState}
          handleValueChange={handleValueChange}
          mode={mode}
          hasMore={false} // 暂时不支持分页
          isRequesting={isRequesting}
          currentPage={currentPage}
          loadMore={loadMore}
          dataList={dataList}
          resetState={resetState}
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
});
