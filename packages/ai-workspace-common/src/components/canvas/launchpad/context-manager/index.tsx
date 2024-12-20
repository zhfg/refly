import { useEffect, useState } from 'react';
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
import { ChatHistorySwitch } from './components/chat-history-switch';

import './index.scss';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';

export const ContextManager = () => {
  const { contextItems, removeContextItem, setContextItems, filterErrorInfo } = useContextPanelStoreShallow(
    (state) => ({
      contextItems: state.contextItems,
      removeContextItem: state.removeContextItem,
      setContextItems: state.setContextItems,
      filterErrorInfo: state.filterErrorInfo,
    }),
  );
  const { handleItemDelete } = useChatHistory();

  const { nodes } = useCanvasControl();
  const selectedContextNodes = nodes.filter(
    (node) => node.selected && (node.type === 'resource' || node.type === 'document'),
  );

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

    if (item.type === 'skillResponse') {
      handleItemDelete(item);
    }

    if (activeItemId === item.id) {
      setActiveItemId(null);
    }
  };

  const selectedNodeIds = selectedContextNodes?.map((node) => node.id) ?? [];

  useEffect(() => {
    const { contextItems } = useContextPanelStore.getState();
    const newContextItems = [
      ...contextItems.filter((item) => !item.isPreview),
      ...selectedContextNodes
        .filter((node) => !contextItems.some((item) => item.id === node.id))
        .map((node) => ({ ...node, isPreview: true })),
    ];
    setContextItems(newContextItems);
  }, [JSON.stringify(selectedNodeIds)]);

  const filteredContextItems = contextItems.filter((item) => item.type !== 'skillResponse');

  return (
    <div className="flex flex-col h-full p-2 px-3">
      <div className="flex flex-col">
        <div className="flex flex-wrap content-start gap-1 w-full">
          {/* {historyItems?.length > 0 && (
            <ChatHistorySwitch
              chatHistoryOpen={chatHistoryOpen}
              setChatHistoryOpen={setChatHistoryOpen}
              items={historyItems}
            />
          )} */}
          <AddBaseMarkContext />
          {filteredContextItems?.map((item) => (
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
