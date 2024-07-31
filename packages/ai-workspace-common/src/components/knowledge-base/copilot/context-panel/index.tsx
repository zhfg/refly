import { Button, Badge, Popover, Tree, Input, Affix, Divider, Checkbox, TreeProps } from '@arco-design/web-react';
import { IconClose, IconStorage } from '@arco-design/web-react/icon';

// styles
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useEffect, useState } from 'react';

// utils
import { searchData, searchDataKeys } from './utils';

// popover
import { KnowledgeBasePopover } from './popover/knowledge-base-and-resource';
import { NotePopover } from './popover/note';
import { ResourcePopover } from './popover/resource';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

const TreeNode = Tree.Node;

export const ContextPanel = () => {
  return (
    <Popover
      color="#FCFCF9"
      popupVisible
      content={<ContextContent />}
      className="context-panel-popover"
      getPopupContainer={() => getPopupContainer()}
    >
      <Badge count={10} dotStyle={{ backgroundColor: '#00968F', fontSize: 8, fontWeight: 'bold' }}>
        <Button icon={<IconStorage />} type="text" className="chat-input-assist-action-item"></Button>
      </Badge>
    </Popover>
  );
};

const ContextContent = () => {
  // 同步通信的状态
  const contextPanelStore = useContextPanelStore();

  const TreeData: TreeProps['treeData'] = [
    {
      title: '当前页面',
      key: 'currentPage',
      children: [
        {
          title: '当前资源',
          key: 'currentPage-currentResource',
        },
        {
          title: '当前知识库',
          key: 'currentPage-currentKnowledgeBase',
        },
        {
          title: '当前笔记',
          key: 'currentPage-currentNote',
        },
      ],
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
  const [treeData, setTreeData] = useState(TreeData);
  const [inputValue, setInputValue] = useState('');

  const initialCheckedKeys = [
    'currentPage-currentResource',
    'currentPage-currentKnowledgeBase',
    'currentPage-currentNote',
  ];
  const initalExpandedKeys = ['currentPage', 'resource', 'knowledgeBase', 'note'];
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState(initialCheckedKeys);
  const [expandedKeys, setExpandedKeys] = useState(initalExpandedKeys);

  const handleConfirm = async () => {};
  const getTotalRealCheckedContext = (checkedKeys: string[]) => {
    const filteredKeys = checkedKeys.filter((key) => {
      if (initalExpandedKeys.includes(key)) {
        return false;
      }

      return true;
    });

    return filteredKeys?.length || 0;
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
  }, [
    contextPanelStore.selectedCollections?.length,
    contextPanelStore.selectedResources?.length,
    contextPanelStore.selectedNotes?.length,
  ]);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span style={{ marginLeft: 8 }}>选择上下文</span>
        </div>
        <div className="header-right">
          <IconClose />
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
            <Button type="primary" style={{ width: 62, height: 32, borderRadius: 8 }} onClick={handleConfirm}>
              保存
            </Button>
          </div>
        </div>
      </Affix>
    </div>
  );
};
