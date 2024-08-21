import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import { SearchResult } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/hooks';

export const NotePopover = () => {
  const { setSelectedNotes } = useContextPanelStore((state) => ({
    setSelectedNotes: state.setSelectedNotes,
  }));
  const { loadMore, hasMore, dataList, isRequesting, currentPage, handleValueChange, mode, resetState } =
    useFetchOrSearchList({
      domain: 'note',
    });

  const updateSelectState = (data: SearchResult[]) => {
    setSelectedNotes(data);
  };

  return (
    <BasePopover
      content={
        <Content
          domain="note"
          title="导入笔记"
          searchPlaceholder="搜索笔记"
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
