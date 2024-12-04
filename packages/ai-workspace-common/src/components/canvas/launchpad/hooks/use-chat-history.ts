import { useEffect } from 'react';
import { ActionResult } from '@refly/openapi-schema';
import {
  NodeItem,
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

export const useChatHistory = () => {
  // Get chat history state and actions
  const { chatHistoryOpen, setChatHistoryOpen } = useLaunchpadStoreShallow((state) => ({
    chatHistoryOpen: state.chatHistoryOpen,
    setChatHistoryOpen: state.setChatHistoryOpen,
  }));

  const { historyItems, setHistoryItems, updateHistoryItem, removeHistoryItem, clearHistoryItems } =
    useContextPanelStoreShallow((state) => ({
      historyItems: state.historyItems,
      setHistoryItems: state.setHistoryItems,
      updateHistoryItem: state.updateHistoryItem,
      removeHistoryItem: state.removeHistoryItem,
      clearHistoryItems: state.clearHistoryItems,
    }));

  // Handle result updates
  useEffect(() => {
    const handleResultUpdate = (payload: { resultId: string; payload: ActionResult }) => {
      const { historyItems } = useContextPanelStore.getState();
      const index = historyItems?.findIndex((item) => item?.data.entityId === payload?.resultId);
      if (index >= 0) {
        updateHistoryItem({ ...historyItems[index], ...payload.payload });
      }
    };

    actionEmitter.on('updateResult', handleResultUpdate);
    return () => {
      actionEmitter.off('updateResult', handleResultUpdate);
    };
  }, []);

  const { nodes, setSelectedNodeByEntity } = useCanvasControl();
  const selectedResultNodes = nodes?.filter((node) => node?.selected && node?.type === 'skillResponse');

  // Sync nodes with history items
  useEffect(() => {
    const { historyItems } = useContextPanelStore.getState();

    const newHistoryItems = [
      ...(selectedResultNodes
        ?.filter((node) => !historyItems?.some((item) => !item?.isPreview && item?.id === node?.id))
        ?.map((node) => ({ ...node, isPreview: true })) ?? []),
      ...(historyItems?.filter((item) => !item?.isPreview) ?? []),
    ];

    setHistoryItems(newHistoryItems);
  }, [JSON.stringify(selectedResultNodes?.map((node) => node?.data.contentPreview))]);

  const handleItemClick = (item: NodeItem) => {
    setSelectedNodeByEntity({ type: 'skillResponse', entityId: item.data.entityId });
  };

  const handleItemPin = (item: NodeItem) => {
    updateHistoryItem({ ...item, isPreview: !item?.isPreview });
  };

  const handleItemDelete = (item: NodeItem) => {
    removeHistoryItem(item.id);
  };

  return {
    chatHistoryOpen,
    setChatHistoryOpen,
    historyItems,
    clearHistoryItems,
    handleItemClick,
    handleItemPin,
    handleItemDelete,
  };
};
