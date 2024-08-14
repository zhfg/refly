import { Button, Badge, Popover, Tree, Input, Affix, Divider, Checkbox, TreeProps } from '@arco-design/web-react';
import { IconClose, IconStorage } from '@arco-design/web-react/icon';

// styles
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// utils
import {
  buildEnvContext,
  getTotalRealCheckedContext,
  initalExpandedKeys,
  initialCheckedKeys,
  searchData,
  searchDataKeys,
} from './utils';

// popover
import { KnowledgeBasePopover } from './popover/knowledge-base-and-resource';
import { NotePopover } from './popover/note';
import { ResourcePopover } from './popover/resource';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { WeblinkPopover } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/popover/weblink.extension';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';

const TreeNode = Tree.Node;

export const ContextContentWithBadge = memo(() => {
  const { checkedKeys } = useContextPanelStore((state) => ({
    checkedKeys: state.checkedKeys,
  }));

  return (
    <Badge
      count={getTotalRealCheckedContext(checkedKeys)}
      dotStyle={{ backgroundColor: '#00968F', fontSize: 8, fontWeight: 'bold' }}
    >
      <WrappedContextPanel />
    </Badge>
  );
});

const WrappedContextPanel = memo(() => {
  console.log('rerender context panel wrapper');
  return <ContextPanel />;
});

export const ContextPanel = memo(() => {
  const setContextPanelPopoverVisible = useContextPanelStore((state) => state.setContextPanelPopoverVisible);
  const contextPanelPopoverVisible = useContextPanelStore((state) => state.contextPanelPopoverVisible);
  console.log('rerender context panel');

  return (
    <Popover
      color="#FCFCF9"
      // popupVisible={contextPanelPopoverVisible}
      // content={contextPanelPopoverVisible ? <ContextContent /> : null}
      content={<ContextContent />}
      className="context-panel-popover"
      getPopupContainer={() => getPopupContainer()}
    >
      <Button
        icon={<IconStorage />}
        type="text"
        className="assist-action-item"
        // onClick={() => {
        //   setContextPanelPopoverVisible(true);
        // }}
      ></Button>
    </Popover>
  );
});

const getState = (state) => ({
  checkedKeys: state.checkedKeys,
  expandedKeys: state.expandedKeys,
  setCheckedKeys: state.setCheckedKeys,
  setExpandedKeys: state.setExpandedKeys,
  setEnvContextInitMap: state.setEnvContextInitMap,
  selectedResources: state.selectedResources,
  selectedCollections: state.selectedCollections,
  selectedNotes: state.selectedNotes,
  selectedWeblinks: state.selectedWeblinks,
  setContextPanelPopoverVisible: state.setContextPanelPopoverVisible,
});

const ContextContent = memo(() => {
  // 同步通信的状态
  const {
    checkedKeys,
    expandedKeys,
    setCheckedKeys,
    setExpandedKeys,
    setEnvContextInitMap,
    selectedResources,
    selectedCollections,
    selectedNotes,
    selectedWeblinks,
  } = useContextPanelStore(getState);
  // 感知 route/页面状态
  const currentKnowledgeBase = useKnowledgeBaseStore((state) => state.currentKnowledgeBase);
  const currentResource = useKnowledgeBaseStore((state) => state.currentResource);
  const currentNote = useNoteStore((state) => state.currentNote);
  console.log('rerender context content');

  let TreeData: TreeProps['treeData'] = [
    {
      title: '当前页面',
      key: 'currentPage',
      children: buildEnvContext(currentKnowledgeBase, currentResource, currentNote),
    },
    {
      title: '资源',
      key: 'resource',
      children: selectedResources?.map((item) => {
        return {
          key: 'resource-' + item?.key,
          title: item?.title,
        };
      }),
    },
    {
      title: '知识库',
      key: 'collection',
      children: selectedCollections?.map((item) => {
        return {
          key: 'collection-' + item?.key,
          title: item?.title,
        };
      }),
    },
    {
      title: '笔记',
      key: 'note',
      children: selectedNotes?.map((item) => {
        return {
          key: `note-` + item?.key,
          title: item?.title,
        };
      }),
    },
  ];

  const runtime = getRuntime();
  if (runtime === 'extension-sidepanel' || runtime === 'extension-csui') {
    TreeData = TreeData.concat({
      title: '浏览器标签',
      key: 'weblink',
      children: selectedWeblinks?.map((item) => {
        return {
          key: `weblink-` + item?.key,
          title: item?.title,
        };
      }),
    });
  }

  //   console.log('contextPanelStore, ',selectedCollections);
  //   const { treeData, setTreeData } = useContextPanelStore();
  const [treeData, setTreeData] = useState(TreeData);
  const [inputValue, setInputValue] = useState('');

  console.log('treeData', treeData);

  // const handleConfirm = async () => {
  //   setContextPanelPopoverVisible(false);
  // };

  const renderExtra = useCallback((node) => {
    console.log('rerender extra', node);
    if (node._key === 'collection') {
      return <KnowledgeBasePopover />;
    }
    if (node._key === 'resource') {
      return <ResourcePopover />;
    }
    if (node._key === 'note') {
      return <NotePopover />;
    }
    if (node._key === 'weblink') {
      console.log('rerender weblink');
      return <WeblinkPopover />;
    }
    return null;
  }, []);

  const renderTitle = (node, checkedKeys) => {
    const title = (node?.title as string) || '';
    const key = (node?._key as string) || '';
    let extraCntTxt = '';

    if (key === 'resource') {
      const len = checkedKeys?.filter((item) => item?.startsWith('resource-')).length;
      extraCntTxt += `（已选择 ${len}）`;
    } else if (key === 'note') {
      const len = checkedKeys?.filter((item) => item?.startsWith('note-')).length;
      extraCntTxt += `（已选择 ${len}）`;
    } else if (key === 'collection') {
      const len = checkedKeys?.filter((item) => item?.startsWith('collection-')).length;
      extraCntTxt += `（已选择 ${len}）`;
    } else if (key === 'weblink') {
      // console.log('render title', key, title, checkedKeys);
      const len = checkedKeys?.filter((item) => item?.startsWith('weblink-')).length;
      extraCntTxt += `（已选择 ${len}）`;
    }

    if (inputValue) {
      const index = title.toLowerCase().indexOf(inputValue.toLowerCase());

      if (index === -1) {
        return (
          <span>
            {title} {extraCntTxt ? <span style={{ color: 'rgb(var(--primary-6))' }}>{extraCntTxt}</span> : null}
          </span>
        );
      }

      const prefix = title.substr(0, index);
      const suffix = title.substr(index + inputValue.length);
      return (
        <span>
          {prefix}
          <span style={{ color: 'var(--color-primary-light-4)' }}>{title.substr(index, inputValue.length)}</span>
          {suffix}
          {extraCntTxt}
        </span>
      );
    }

    return (
      <span>
        {title} {extraCntTxt ? <span style={{ color: 'rgb(var(--primary-6))' }}>{extraCntTxt}</span> : null}
      </span>
    );
  };

  useEffect(() => {
    if (!inputValue) {
      setTreeData(TreeData);
    } else {
      const result = searchData(inputValue, TreeData);
      setTreeData(result);
    }
  }, [inputValue]);

  // 同步 treeData
  useEffect(() => {
    setTreeData(TreeData);
    setExpandedKeys(initalExpandedKeys);
  }, [selectedCollections?.length, selectedResources?.length, selectedNotes?.length, selectedWeblinks?.length]);
  useEffect(() => {
    setTreeData(TreeData);
  }, [currentKnowledgeBase, currentResource, currentNote]);
  useEffect(() => {
    setExpandedKeys(initalExpandedKeys);
  }, []);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span style={{ marginLeft: 8 }}>选择上下文</span>
        </div>
        <div className="header-right">
          {/* <Button type="text" onClick={handleConfirm} className="assist-action-item">
            <IconClose />
          </Button> */}
        </div>
      </div>
      <div className="context-content-body">
        <Input.Search
          style={{
            marginBottom: 8,
          }}
          className={'context-content-search'}
          onChange={setInputValue}
          placeholder="搜索已选中的上下文"
        />
        <Divider style={{ margin: `16px 0` }} />
        <Tree
          treeData={treeData}
          blockNode
          checkable
          checkedKeys={checkedKeys}
          expandedKeys={expandedKeys}
          onCheck={(checkedKeys, { checked, node }) => {
            if (initialCheckedKeys?.includes(node.key)) {
              const domain = node?.key?.split('-')[1];
              setEnvContextInitMap({ [domain]: true });
            }

            // console.log('main context panel', checkedKeys);
            setCheckedKeys(checkedKeys);
          }}
          showLine
          renderExtra={renderExtra}
          renderTitle={(node) => renderTitle(node, checkedKeys)}
        ></Tree>
      </div>
      <Affix offsetBottom={0} target={() => document.querySelector('.context-content-container') as HTMLElement}>
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
              <span className="footer-count text-item">已选择（{getTotalRealCheckedContext(checkedKeys)}）</span>
            </Checkbox>
          </div>
          <div className="footer-action">
            {/* <Button
              type="primary"
              style={{ width: 62, height: 28, borderRadius: 8, fontSize: 12 }}
              onClick={handleConfirm}
            >
              保存
            </Button> */}
          </div>
        </div>
      </Affix>
    </div>
  );
});
