import { Button, Badge, Popover, Tree, Input, Affix, Divider, Checkbox, TreeProps } from '@arco-design/web-react';
import { IconClose, IconStorage } from '@arco-design/web-react/icon';

// styles
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useEffect, useRef, useState } from 'react';

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

const TreeNode = Tree.Node;

export const ContextPanel = () => {
  const { checkedKeys, contextPanelPopoverVisible, setContextPanelPopoverVisible } = useContextPanelStore();
  const { currentKnowledgeBase, currentResource, currentNote } = useCopilotContextState();
  const propsInitialCheckedKeys = initialCheckedKeys?.filter((key) => {
    if (!currentKnowledgeBase?.collectionId && key.startsWith('currentPage-currentKnowledgeBase')) {
      return false;
    }

    if (!currentResource?.resourceId && key.startsWith('currentPage-currentResource')) {
      return false;
    }

    if (!currentNote?.noteId && key.startsWith('currentPage-currentNote')) {
      return false;
    }

    return true;
  });

  return (
    <Popover
      color="#FCFCF9"
      popupVisible={contextPanelPopoverVisible}
      content={<ContextContent initialCheckedKeys={propsInitialCheckedKeys} />}
      className="context-panel-popover"
      getPopupContainer={() => getPopupContainer()}
    >
      <Badge
        count={getTotalRealCheckedContext(checkedKeys)}
        dotStyle={{ backgroundColor: '#00968F', fontSize: 8, fontWeight: 'bold' }}
      >
        <Button
          icon={<IconStorage />}
          type="text"
          className="chat-input-assist-action-item"
          onClick={() => {
            setContextPanelPopoverVisible(true);
          }}
        ></Button>
      </Badge>
    </Popover>
  );
};

const ContextContent = (props: { initialCheckedKeys: string[] }) => {
  // 同步通信的状态
  const contextPanelStore = useContextPanelStore();
  const { checkedKeys, expandedKeys, setCheckedKeys, setExpandedKeys } = contextPanelStore;
  // 感知 route/页面状态
  const { currentKnowledgeBase, currentResource, currentNote } = useCopilotContextState();

  const TreeData: TreeProps['treeData'] = [
    {
      title: '当前页面',
      key: 'currentPage',
      children: buildEnvContext(currentKnowledgeBase, currentResource, currentNote),
    },
    {
      title: '资源',
      key: 'resource',
      children: contextPanelStore?.selectedResources?.map((item) => {
        return {
          key: 'resource-' + item?.key,
          title: item?.title,
        };
      }),
    },
    {
      title: '知识库',
      key: 'knowledgeBase',
      children: contextPanelStore?.selectedCollections?.map((item) => {
        return {
          key: 'knowledgeBase-' + item?.key,
          title: item?.title,
        };
      }),
    },
    {
      title: '笔记',
      key: 'note',
      children: contextPanelStore?.selectedNotes?.map((item) => {
        return {
          key: `note-` + item?.key,
          title: item?.title,
        };
      }),
    },
  ];
  //   console.log('contextPanelStore, ', contextPanelStore.selectedCollections);
  //   const { treeData, setTreeData } = useContextPanelStore();
  const [treeData, setTreeData] = useState(TreeData);
  //   const treeData = contextPanelStore.treeData;
  //   const setTreeData = contextPanelStore.setTreeData;
  const [inputValue, setInputValue] = useState('');

  console.log('treeData', treeData);

  const handleConfirm = async () => {
    contextPanelStore.setContextPanelPopoverVisible(false);
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
    contextPanelStore.setTreeData(TreeData);
    setTreeData(TreeData);
    contextPanelStore.setExpandedKeys(initalExpandedKeys);
  }, [
    contextPanelStore.selectedCollections?.length,
    contextPanelStore.selectedResources?.length,
    contextPanelStore.selectedNotes?.length,
  ]);
  useEffect(() => {
    contextPanelStore.setTreeData(TreeData);
    setTreeData(TreeData);
  }, [currentKnowledgeBase, currentResource]);
  useEffect(() => {
    if (contextPanelStore?.checkedKeys?.length === 0) {
      console.log('checkedKeys', props.initialCheckedKeys);
      contextPanelStore.setCheckedKeys(props.initialCheckedKeys);
    }
  }, []);
  useEffect(() => {
    contextPanelStore.setExpandedKeys(initalExpandedKeys);
  }, []);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span style={{ marginLeft: 8 }}>选择上下文</span>
        </div>
        <div className="header-right">
          <Button type="text" onClick={handleConfirm} className="assist-action-item">
            <IconClose />
          </Button>
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
          onCheck={(checkedKeys) => {
            setCheckedKeys(checkedKeys);
          }}
          showLine
          renderExtra={(node) => {
            if (node._key === 'knowledgeBase') {
              return <KnowledgeBasePopover />;
            }

            if (node._key === 'resource') {
              return <ResourcePopover />;
            }

            if (node._key === 'note') {
              return <NotePopover />;
            }

            return null;
          }}
          renderTitle={(node) => {
            const title = (node?.title as string) || '';
            const key = (node?._key as string) || '';
            let extraCntTxt = '';

            if (key === 'resource') {
              const len = checkedKeys?.filter((item) => item?.startsWith('resource-')).length;
              extraCntTxt += `（已选择 ${len}）`;
            } else if (key === 'note') {
              const len = checkedKeys?.filter((item) => item?.startsWith('note-')).length;
              extraCntTxt += `（已选择 ${len}）`;
            } else if (key === 'knowledgeBase') {
              const len = checkedKeys?.filter((item) => item?.startsWith('knowledgeBase-')).length;
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
                  <span style={{ color: 'var(--color-primary-light-4)' }}>
                    {title.substr(index, inputValue.length)}
                  </span>
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
          }}
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
            <Button
              type="primary"
              style={{ width: 62, height: 28, borderRadius: 8, fontSize: 12 }}
              onClick={handleConfirm}
            >
              保存
            </Button>
          </div>
        </div>
      </Affix>
    </div>
  );
};
