import { useEffect, useState, useCallback } from 'react';
import { ContextItem } from './context-item';
import { useTranslation } from 'react-i18next';

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
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';

export const ContextManager = () => {
  const { t } = useTranslation();
  const { selectedContextItems, removeContextItem, setContextItems, clearContextItems, filterErrorInfo } =
    useContextPanelStoreShallow((state) => ({
      selectedContextItems: state.contextItems,
      removeContextItem: state.removeContextItem,
      setContextItems: state.setContextItems,
      clearContextItems: state.clearContextItems,
      filterErrorInfo: state.filterErrorInfo,
    }));
  const { nodes } = useCanvasControl();
  const selectedContextNodes = nodes.filter(
    (node) => node.selected && (node.type === 'resource' || node.type === 'document'),
  );
  // const { initMessageListener } = useSelectedMark();
  const [activeItemId, setActiveItemId] = useState(null);
  const { chatHistoryOpen, setChatHistoryOpen } = useLaunchpadStoreShallow((state) => ({
    chatHistoryOpen: state.chatHistoryOpen,
    setChatHistoryOpen: state.setChatHistoryOpen,
  }));
  const { historyItems } = useContextPanelStoreShallow((state) => ({
    historyItems: state.historyItems,
  }));

  const handleRemoveItem = (item: CanvasNode<any>) => {
    removeContextItem(item.id);
    if (activeItemId === item.id) {
      setActiveItemId(null);
    }
  };

  const selectedNodeIds = selectedContextNodes?.map((node) => node.id) ?? [];

  useEffect(() => {
    const { contextItems: selectedContextItems } = useContextPanelStore.getState();
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

  // useEffect(() => {
  //   initMessageListener();
  // }, []);

  return (
    <div className="flex flex-col h-full p-2 px-3 launchpad-context-manager">
      <div className="flex flex-col context-content">
        <div className="flex flex-wrap content-start gap-1 w-full context-items-container">
          {historyItems?.length > 0 && (
            <ChatHistorySwitch
              chatHistoryOpen={chatHistoryOpen}
              setChatHistoryOpen={setChatHistoryOpen}
              items={historyItems}
            />
          )}
          <AddBaseMarkContext />
          {selectedContextItems?.map((item) => (
            <ContextItem
              key={item?.id}
              item={item}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item?.type)]}
              isActive={selectedContextNodes.some((node) => node.id === item.id)}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
