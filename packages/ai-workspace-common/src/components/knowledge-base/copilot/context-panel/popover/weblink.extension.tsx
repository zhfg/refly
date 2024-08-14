import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { memo, useCallback, useEffect, useState } from 'react';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { searchData } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/utils';

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
  const [treeData, setTreeData] = useState(dataList);
  const [inputValue, setInputValue] = useState('');

  const handledTreeData = dataList.map((item, index) => {
    return {
      title: item?.title,
      key: `weblink_${index}_${item?.id}`,
    };
  });

  const updateSelectState = (data: SearchResult[]) => {
    setSelectedWeblinks(data);
  };

  const renderTitle = useCallback(
    ({ title, inputValue }: { title: string; inputValue: string }) => {
      if (inputValue) {
        const index = title.toLowerCase().indexOf(inputValue.toLowerCase());

        if (index === -1) {
          return <span>{title}</span>;
        }

        const prefix = title.substr(0, index);
        const suffix = title.substr(index + inputValue.length);
        return (
          <span>
            {prefix}
            <span style={{ color: 'var(--color-primary-light-4)' }}>{title.substr(index, inputValue.length)}</span>
            {suffix}
          </span>
        );
      }

      return <span>{title}</span>;
    },
    [inputValue],
  );

  useEffect(() => {
    setTreeData(dataList);
  }, [dataList?.length]);

  return (
    <BasePopover
      content={
        <Content
          domain="weblink"
          title="从打开的浏览器页面添加"
          searchPlaceholder="搜索打开页面"
          updateSelectState={updateSelectState}
          handleValueChange={(inputValue) => {
            setInputValue(inputValue);
            if (!inputValue) {
              setTreeData(dataList);
            } else {
              const result = searchData(inputValue, dataList);
              setTreeData(result);
            }
          }}
          mode={mode}
          hasMore={false} // 暂时不支持分页
          isRequesting={isRequesting}
          currentPage={currentPage}
          loadMore={loadMore}
          dataList={treeData}
          resetState={resetState}
          renderTitle={({ title }) => {
            return renderTitle({ title, inputValue });
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
});
