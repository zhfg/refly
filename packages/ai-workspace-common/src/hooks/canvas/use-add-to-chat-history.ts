import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { NodeItem, useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

interface AddToChatHistoryOptions {
  showMessage?: boolean;
}

export const useAddToChatHistory = () => {
  const { t } = useTranslation();

  const addSingleNodeToHistory = useCallback(
    (node: NodeItem, options: AddToChatHistoryOptions = {}) => {
      const { showMessage = true } = options;
      const contextStore = useContextPanelStore.getState();
      const historyItems = contextStore.historyItems;

      // Check if node is already in context
      const existingItem = historyItems.find((item) => item.id === node.id);

      if (existingItem) {
        contextStore.updateHistoryItem({ ...node, isPreview: false });
        if (showMessage) {
          message.warning(t('canvas.chatHistory.alreadyAdded'));
        }
        return;
      }

      // Add node to context
      contextStore.addHistoryItem(node);
      if (showMessage) {
        message.success(t('canvas.chatHistory.addSuccess'));
      }
    },
    [t],
  );

  const addNodesToHistory = useCallback(
    (nodes: NodeItem[], options: AddToChatHistoryOptions = {}) => {
      // Add each node to history
      const results = nodes.map((node) => addSingleNodeToHistory(node, { ...options }));
      return results.length;
    },
    [addSingleNodeToHistory],
  );

  return {
    addToHistory: addSingleNodeToHistory,
    addNodesToHistory,
  };
};
