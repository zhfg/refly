import React from 'react';
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
import { searchData, searchDataKeys } from '../utils';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ResourceType, SearchDomain, SearchResult } from '@refly/openapi-schema';

export const BasePopover = (props: { children: React.ReactNode; content: React.ReactNode }) => {
  return (
    <Popover
      color="#FCFCF9"
      position="right"
      // popupVisible
      content={props.content}
      className="context-panel-popover"
      getPopupContainer={() => getPopupContainer()}
    >
      {props.children}
    </Popover>
  );
};

export interface ContentProps {
  resourceType?: ResourceType;
  domain: SearchDomain;
  searchPlaceholder: string;
  title: string;
  fetchData?: (payload: { pageSize: number; page: number }) => Promise<{ success: boolean; data?: SearchResult[] }>;
}

export const Content = (props: ContentProps) => {
  const { loadMore, hasMore, dataList, isRequesting, currentPage, handleValueChange, mode } = useFetchOrSearchList({
    fetchData: props.fetchData,
  });
  const handledTreeData = dataList.map((item, index) => {
    return {
      title: item?.title,
      key: `${props?.domain}_${index}_${item?.id}`,
    };
  });
  const [treeData, setTreeData] = useState(handledTreeData);
  const [inputValue, setInputValue] = useState('');

  const [selectedKeys, setSelectedKeys] = useState([]);
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

  // 获取知识库
  useEffect(() => {
    loadMore(0);
  }, []);
  useEffect(() => {
    setTreeData(handledTreeData);
  }, [handledTreeData]);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span style={{ marginLeft: 8 }}>{props.title}</span>
        </div>
        <div className="header-right">
          <IconClose />
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
          renderTitle={({ title }: { title: string }) => {
            return <span dangerouslySetInnerHTML={{ __html: title }}></span>;
          }}
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
};
