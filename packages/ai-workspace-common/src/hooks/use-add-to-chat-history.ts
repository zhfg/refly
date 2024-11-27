import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useContextPanelStore } from '../stores/context-panel';
import { ActionResult } from '@refly/openapi-schema';

export const useAddToChatHistory = (result: ActionResult) => {
  const { t } = useTranslation();

  return useCallback(() => {
    const contextStore = useContextPanelStore.getState();
    const selectedResultItems = contextStore.selectedResultItems;

    // Check if node is already in context
    const existingItem = selectedResultItems.find((item) => item.resultId === result.resultId);

    if (existingItem) {
      contextStore.updateResultItem({ ...result, isPreview: false });
      message.warning(t('canvas.chatHistory.alreadyAdded'));
      return;
    }

    // Add node to context
    contextStore.addResultItem(result);
    message.success(t('canvas.chatHistory.addSuccess'));
  }, [result, t]);
};
