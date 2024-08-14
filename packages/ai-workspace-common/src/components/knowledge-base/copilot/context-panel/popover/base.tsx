import React, { memo } from 'react';
import {
  Button,
  Badge,
  Popover,
  Tree,
  Input,
  Affix,
  Divider,
  Checkbox,
  TreeNodeProps,
  TreeProps,
} from '@arco-design/web-react';
import { IconClose, IconStorage } from '@arco-design/web-react/icon';

// styles
import '../index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useEffect, useState } from 'react';

// utils
import { getSelectedData } from '../utils';
import { ListMode, useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';

// requests
import { SearchResult } from '@refly/openapi-schema';
import { ContextPanelDomain } from '@refly/common-types';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const BasePopover = memo((props: { children: React.ReactNode; content: React.ReactNode }) => {
  const {} = props;

  return (
    <Popover
      unmountOnExit
      color="#FCFCF9"
      position="right"
      content={props.content}
      className="context-panel-popover"
      getPopupContainer={() => getPopupContainer()}
    >
      {props.children}
    </Popover>
  );
});

export interface ContentProps {
  domain: ContextPanelDomain;
  hasMore: boolean;
  mode: ListMode;
  renderTitle: ({ title }: { title: string }) => React.ReactNode;
  resetState: () => void;
  isRequesting: boolean;
  currentPage: number;
  loadMore: (page?: number) => void;
  updateSelectState: (data: SearchResult[]) => void;
  handleValueChange: (val: string, domains: ContextPanelDomain[]) => void;
  dataList: SearchResult[];
  searchPlaceholder: string;
  title: string;
  fetchData?: (payload: { pageSize: number; page: number }) => Promise<{ success: boolean; data?: SearchResult[] }>;
}

export const Content = memo((props: ContentProps) => {
  const {
    mode,
    hasMore,
    isRequesting,
    currentPage,
    dataList,
    loadMore,
    updateSelectState,
    handleValueChange,
    resetState,
    renderTitle,
  } = props;
  const handledTreeData = dataList.map((item, index) => {
    return {
      title: item?.title,
      key: `${props?.domain}_${index}_${item?.id}`,
    };
  });
  const [treeData, setTreeData] = useState(handledTreeData);

  const [checkedKeys, setCheckedKeys] = useState([]);

  const handleConfirm = async () => {};

  // useEffect(() => {
  //   if (!inputValue) {
  //     loadMore(0);
  //   } else {
  //     const result = searchData(inputValue, treeData);
  //     setTreeData(result);
  //   }
  // }, [inputValue, treeData]);

  console.log('handledTreeData', handledTreeData);
  useEffect(() => {
    setTreeData(handledTreeData);
  }, [handledTreeData?.length]);

  // 上升状态，更新状态到 context panel 中用于控制
  useEffect(() => {
    const selectedData = getSelectedData(checkedKeys, treeData);
    updateSelectState(selectedData);
    console.log('selectedData', selectedData, props, checkedKeys, treeData);
  }, [checkedKeys, treeData, props.domain]);

  useEffect(() => {
    loadMore();

    return () => {
      resetState();
    };
  }, []);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span style={{ marginLeft: 8 }}>{props.title}</span>
        </div>
        <div className="header-right">
          {/* <Button
            type="text"
            className="assist-action-item"
          >
            <IconClose />
          </Button> */}
        </div>
      </div>
      <div className="context-content-body popover-content-body">
        <Input.Search
          style={{
            marginBottom: 8,
          }}
          className={'context-content-search'}
          onChange={(val) => handleValueChange(val, [props.domain])}
          placeholder={props.searchPlaceholder}
        />
        <Divider style={{ margin: `16px 0` }} />
        <Tree
          treeData={treeData}
          blockNode
          checkable
          checkedKeys={checkedKeys}
          onCheck={(checkedKeys) => setCheckedKeys(checkedKeys)}
          showLine
          renderTitle={renderTitle}
        ></Tree>
      </div>
      <div>
        {mode === 'fetch' && hasMore ? (
          <div className="search-load-more">
            <Button type="text" loading={isRequesting} onClick={() => loadMore(currentPage)}>
              加载更多
            </Button>
          </div>
        ) : null}
      </div>
      {/* <Affix offsetBottom={0} target={() => document.querySelector('.context-content-container') as HTMLElement}>
        <div className="context-content-footer">
          <div className="footer-location">
            <Checkbox
              checked={checkedKeys?.length > 0}
              onChange={() => {
                if (checkedKeys?.length > 0) {
                  setCheckedKeys([]);
                } else {
                  const allCheckedKeys = searchDataKeys('', treeData);
                  setCheckedKeys(allCheckedKeys);
                }
              }}
            >
              <span className="footer-count text-item">已选择（{checkedKeys?.length}）</span>
            </Checkbox>
          </div>
          <div className="footer-action">
            <Button type="primary" style={{ width: 62, height: 32, borderRadius: 8 }} onClick={handleConfirm}>
              保存
            </Button>
          </div>
        </div>
      </Affix> */}
    </div>
  );
});
