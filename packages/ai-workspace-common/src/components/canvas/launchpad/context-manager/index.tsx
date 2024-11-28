import { useEffect, useState, useCallback } from 'react';
import { ContextItem } from './context-item';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';

// components
import { AddBaseMarkContext } from './components/add-base-mark-context';

// stores
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';

import { mapSelectionTypeToContentList } from './utils/contentListSelection';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { ChatHistorySwitch } from './components/chat-history-switch';
import { ContextPreview } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/context-preview';

import './index.scss';

export const ContextManager = () => {
  const { t } = useTranslation();
  const { selectedContextItems, removeContextItem, setContextItems, clearContextItems, filterErrorInfo } =
    useContextPanelStoreShallow((state) => ({
      selectedContextItems: state.selectedContextItems,
      removeContextItem: state.removeContextItem,
      setContextItems: state.setContextItems,
      clearContextItems: state.clearContextItems,
      filterErrorInfo: state.filterErrorInfo,
    }));
  const { nodes, setSelectedNode } = useCanvasControl();
  const selectedContextNodes = nodes.filter(
    (node) => node.selected && (node.type === 'resource' || node.type === 'document'),
  );
  const { initMessageListener } = useSelectedMark();
  const [activeItemId, setActiveItemId] = useState(null);

  const handleItemClick = useCallback(
    async (item: CanvasNode<any>) => {
      const isSelectionNode = item.data?.metadata?.sourceType?.includes('Selection');

      if (isSelectionNode) {
        const sourceEntityId = item.data?.metadata?.sourceEntityId;
        const sourceEntityType = item.data?.metadata?.sourceEntityType;

        if (!sourceEntityId || !sourceEntityType) {
          console.warn('Missing source entity information for selection node');
          return;
        }

        const sourceNode = nodes.find(
          (node) => node.data?.entityId === sourceEntityId && node.type === sourceEntityType,
        );

        if (!sourceNode) {
          Message.warning({
            content: t('canvas.contextManager.nodeNotFound'),
          });
          return;
        }

        setSelectedNode(sourceNode);
      } else {
        setSelectedNode(item);
      }
    },
    [nodes, setSelectedNode, t],
  );

  const handleRemoveItem = (item: CanvasNode<any>) => {
    removeContextItem(item.id);
    if (activeItemId === item.id) {
      setActiveItemId(null);
    }
  };

  const selectedNodeIds = selectedContextNodes?.map((node) => node.id) ?? [];

  useEffect(() => {
    const { selectedContextItems } = useContextPanelStore.getState();
    const newContextItems = [
      ...selectedContextItems.filter((item) => !item.isPreview),
      ...selectedContextNodes
        .filter((node) => !selectedContextItems.some((item) => item.id === node.id))
        .map((node) => ({ ...node, isPreview: true })),
    ];
    setContextItems(newContextItems);
  }, [JSON.stringify(selectedNodeIds)]);

  useEffect(() => {
    return () => {
      clearContextItems();
    };
  }, []);

  useEffect(() => {
    initMessageListener();
  }, []);

  const activeItem = selectedContextItems?.find((item) => item.id === activeItemId);

  return (
    <div className="flex flex-col h-full p-2 px-3 launchpad-context-manager">
      <div className="flex flex-col context-content">
        <div className="flex flex-wrap content-start gap-1 w-full context-items-container">
          <ChatHistorySwitch />
          <AddBaseMarkContext />
          {selectedContextItems?.map((item) => (
            <ContextItem
              key={item?.id}
              item={item}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item?.type)]}
              isActive={selectedContextNodes.some((node) => node.id === item.id)}
              onClick={() => handleItemClick(item)}
              onRemove={handleRemoveItem}
              onOpenUrl={(url) => {
                if (typeof url === 'function') {
                  url();
                } else if (typeof url === 'string') {
                  window.open(url, '_blank');
                } else {
                  handleItemClick(item);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
