import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { NodeItem, useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const useAddToChatHistory = (node: NodeItem) => {
  const { t } = useTranslation();

  return useCallback(() => {
    const contextStore = useContextPanelStore.getState();
    const historyItems = contextStore.historyItems;

    // Check if node is already in context
    const existingItem = historyItems.find((item) => item.id === node.id);

    if (existingItem) {
      contextStore.updateHistoryItem({ ...node, isPreview: false });
      message.warning(t('canvas.chatHistory.alreadyAdded'));
      return;
    }

    // Add node to context
    contextStore.addHistoryItem(node);
    message.success(t('canvas.chatHistory.addSuccess'));
  }, [node, t]);
};
