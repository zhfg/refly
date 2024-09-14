import { useState } from 'react';
import { ContextItem } from './context-item';
import { ContextPreview } from './context-preview';
import { Button, Message } from '@arco-design/web-react';
import { IconPlus, IconFile, IconBook, IconFolder, IconRefresh } from '@arco-design/web-react/icon';

// hooks
import { useProcessContextItems } from './hooks/use-process-context-items';

import './index.scss';

// components
import { ContentSelectorBtn } from '@refly-packages/ai-workspace-common/modules/content-selector/components/content-selector-btn';
import { ResetContentSelectorBtn } from './reset-content-selector-btn';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const ContextManager = () => {
  const [activeItemId, setActiveItemId] = useState(null);
  const { processedContextItems } = useProcessContextItems();
  const { addMark, removeMark, toggleMarkActive, clearMarks } = useContextPanelStore((state) => ({
    addMark: state.addMark,
    removeMark: state.removeMark,
    toggleMarkActive: state.toggleMarkActive,
    clearMarks: state.clearMarks,
  }));

  console.log('processedContextItems', processedContextItems);

  const handleAddItem = (type) => {
    // setContextItems((prevItems) => [...prevItems, newItem]);
  };

  const handleToggleItem = (id) => {
    toggleMarkActive(id);
    setActiveItemId((prevId) => (prevId === id ? null : id));
  };

  const handleRemoveItem = (id) => {
    removeMark(id);
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  const activeItem = processedContextItems.find((item) => item.id === activeItemId);

  const handleExpandItem = (id) => {
    // 这里可以添加展开项目的逻辑
    console.log(`Expanding item with id: ${id}`);
    // 例如，可以设置一个新的状态来跟踪展开的项目
    // setExpandedItems(prev => [...prev, id]);
  };

  return (
    <div className="context-manager">
      <div className="context-content">
        <div className="context-items-container">
          <Button
            icon={<IconPlus style={{ fontSize: 10 }} />}
            size="mini"
            type="outline"
            style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
            onClick={() => handleAddItem('resource')}
          ></Button>

          <ContentSelectorBtn />

          <ResetContentSelectorBtn />

          {processedContextItems.map((item) => (
            <ContextItem
              key={item.id}
              item={item}
              isActive={item.id === activeItemId}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
        {activeItem && (
          <ContextPreview
            item={activeItem}
            onClose={() => setActiveItemId(null)}
            onRemove={handleRemoveItem}
            onOpenUrl={(url) => {
              if (typeof url === 'function') {
                url(); // 执行跳转函数
              } else {
                window.open(url, '_blank'); // 打开外部链接
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
