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
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

export const useChatHistory = () => {
  // const { t } = useTranslation();
  // Get chat history state and actions
  const { chatHistoryOpen, setChatHistoryOpen } = useLaunchpadStoreShallow((state) => ({
    chatHistoryOpen: state.chatHistoryOpen,
    setChatHistoryOpen: state.setChatHistoryOpen,
  }));

  const { historyItems, setHistoryItems, updateHistoryItem, removeHistoryItem, clearHistoryItems, pinAllHistoryItems } =
    useContextPanelStoreShallow((state) => ({
      historyItems: state.historyItems,
      setHistoryItems: state.setHistoryItems,
      updateHistoryItem: state.updateHistoryItem,
      removeHistoryItem: state.removeHistoryItem,
      clearHistoryItems: state.clearHistoryItems,
      pinAllHistoryItems: state.pinAllHistoryItems,
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
    const { historyItems, contextItems } = useContextPanelStore.getState();
    const contextStore = useContextPanelStore.getState();

    const newHistoryItems = [
      ...(selectedResultNodes
        ?.filter((node) => !historyItems?.some((item) => !item?.isPreview && item?.id === node?.id))
        ?.map((node) => ({ ...node, isPreview: true })) ?? []),
      ...(historyItems?.filter((item) => !item?.isPreview) ?? []),
    ];

    // Sync context items with history items
    contextItems.forEach((contextItem) => {
      // Remove context item if it's a skill response and not in history
      if (
        contextItem.type === 'skillResponse' &&
        !newHistoryItems.some((historyItem) => historyItem.id === contextItem.id)
      ) {
        contextStore.removeContextItem(contextItem.id);
      }
    });

    // Add missing history items to context
    newHistoryItems.forEach((historyItem) => {
      if (
        historyItem.type === 'skillResponse' &&
        !contextItems.some((contextItem) => contextItem.id === historyItem.id)
      ) {
        contextStore.addContextItem(historyItem);
      }
    });

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

  const handleItemAdd = (node: NodeItem) => {
    const contextStore = useContextPanelStore.getState();
    const historyItems = contextStore.historyItems;

    // Check if node is already in context
    const existingItem = historyItems.find((item) => item.id === node.id);

    if (existingItem) {
      contextStore.updateHistoryItem({ ...node, isPreview: false });
      // message.warning(t('canvas.chatHistory.alreadyAdded'));
      return;
    }

    // Add node to context
    contextStore.addHistoryItem(node);
    // message.success(t('canvas.chatHistory.addSuccess'));
  };

  return {
    chatHistoryOpen,
    setChatHistoryOpen,
    historyItems,
    clearHistoryItems,
    handleItemClick,
    handleItemPin,
    handleItemDelete,
    pinAllHistoryItems,
    handleItemAdd,
  };
};
