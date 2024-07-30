import { Button, Badge, Popover, Tree, Input, Affix, Divider, Checkbox } from '@arco-design/web-react';
import { IconClose, IconStorage } from '@arco-design/web-react/icon';

// styles
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useEffect, useState } from 'react';

const TreeNode = Tree.Node;
const TreeData = [
  {
    title: '当前页面',
    key: 'currentPage',
    children: [
      {
        title: 'Branch 0-0-1',
        key: '0-0-1',
        children: [
          {
            title: 'Leaf 0-0-1-1',
            key: '0-0-1-1',
          },
          {
            title: 'Leaf 0-0-1-2',
            key: '0-0-1-2',
          },
        ],
      },
    ],
  },
  {
    title: '知识库 & 资源',
    key: '0-1',
    children: [
      {
        title: 'Branch 0-1-1',
        key: '0-1-1',
        children: [
          {
            title: 'Leaf 0-1-1-0',
            key: '0-1-1-0',
          },
        ],
      },
      {
        title: 'Branch 0-1-2',
        key: '0-1-2',
        children: [
          {
            title: 'Leaf 0-1-2-0',
            key: '0-1-2-0',
          },
        ],
      },
    ],
  },
  {
    title: '笔记',
    key: '0-2',
    children: [
      {
        title: 'Branch 0-1-1',
        key: '0-2-1',
        children: [
          {
            title: 'Leaf 0-2-1-0',
            key: '0-2-1-0',
          },
        ],
      },
      {
        title: 'Branch 0-2-2',
        key: '0-2-2',
        children: [
          {
            title: 'Leaf 0-2-2-0',
            key: '0-2-2-0',
          },
        ],
      },
    ],
  },
];

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
  const [treeData, setTreeData] = useState(TreeData);
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = async () => {};

  useEffect(() => {
    if (!inputValue) {
      setTreeData(TreeData);
    } else {
      const result = searchData(inputValue);
      setTreeData(result);
    }
  }, [inputValue]);

  return (
    <div className="context-content-container">
      <div className="context-content-header">
        <div className="header-left">
          <IconStorage />
          <span>选择上下文</span>
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
            <Checkbox>
              <span className="footer-count text-item">已选择</span>
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

function searchData(inputValue) {
  const loop = (data) => {
    const result = [];
    data.forEach((item) => {
      if (item.title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
        result.push({ ...item });
      } else if (item.children) {
        const filterData = loop(item.children);

        if (filterData.length) {
          result.push({ ...item, children: filterData });
        }
      }
    });
    return result;
  };

  return loop(TreeData);
}
