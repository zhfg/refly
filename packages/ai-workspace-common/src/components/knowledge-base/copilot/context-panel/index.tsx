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
  const TreeData: TreeProps['treeData'] = [
    {
      title: '当前页面',
      key: 'currentPage',
      children: [
        {
          title: '当前资源',
          key: 'currentPage-currentResource',
          selected: true,
        },
        {
          title: '当前知识库',
          key: 'currentPage-currentKnowledgeBase',
          selected: true,
        },
        {
          title: '当前笔记',
          key: 'currentPage-currentNote',
          selected: true,
        },
      ],
    },
    {
      title: '资源',
      key: 'resource',
      children: [],
    },
    {
      title: '知识库',
      key: 'knowledgeBase',
      children: [],
    },
    {
      title: '笔记',
      key: 'note',
      children: [],
    },
  ];
  const [treeData, setTreeData] = useState(TreeData);
  const [inputValue, setInputValue] = useState('');

  const initialCheckedKeys = [
    'currentPage-currentResource',
    'currentPage-currentKnowledgeBase',
    'currentPage-currentNote',
  ];
  const initalExpandedKeys = ['currentPage'];
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState(initialCheckedKeys);
  const [expandedKeys, setExpandedKeys] = useState(initalExpandedKeys);

  const handleConfirm = async () => {};

  useEffect(() => {
    if (!inputValue) {
      setTreeData(TreeData);
    } else {
      const result = searchData(inputValue, TreeData);
      setTreeData(result);
    }
  }, [inputValue]);

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
          onCheck={(checkedKeys) => setCheckedKeys(checkedKeys)}
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
          renderTitle={({ title }: { title: string }) => {
            if (inputValue) {
              const index = title.toLowerCase().indexOf(inputValue.toLowerCase());

              if (index === -1) {
                return title;
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
                </span>
              );
            }

            return title;
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
              <span className="footer-count text-item">已选择（{checkedKeys?.length}）</span>
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
