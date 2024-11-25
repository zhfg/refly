import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useActionResultStore } from '@refly-packages/ai-workspace-common/stores/action-result';
import { IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';

export const ChatHistory: React.FC = () => {
  const { t } = useTranslation();
  const { selectedResultItems, addResultItem, removeResultItem, removePreviewResultItem, clearResultItems } =
    useContextPanelStoreShallow((state) => ({
      selectedResultItems: state.selectedResultItems,
      addResultItem: state.addResultItem,
      removeResultItem: state.removeResultItem,
      removePreviewResultItem: state.removePreviewResultItem,
      clearResultItems: state.clearResultItems,
    }));
  const { selectedNode } = useCanvasControl();

  useEffect(() => {
    if (selectedNode?.type === 'skillResponse') {
      // Add the selected node as a preview item
      const item = selectedResultItems.find((item) => item.resultId === selectedNode.data.entityId);
      if (!item) {
        const resultId = selectedNode.data.entityId;
        const result = useActionResultStore.getState().resultMap[resultId];

        if (!result) {
          return;
        }

        removePreviewResultItem();
        addResultItem({
          resultId,
          title: result.title,
          content: result.content,
          isPreview: true,
        });
      }
    } else {
      removePreviewResultItem();
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    return () => {
      clearResultItems();
    };
  }, []);

  if (!selectedResultItems?.length) {
    return null;
  }

  return (
    <div
      className="w-full max-w-4xl mx-auto p-3 space-y-4 rounded-lg bg-white mb-1"
      style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
    >
      {selectedResultItems?.map((result, index) => (
        <div key={index} className="space-y-2">
          <div>
            <p className="text-gray-800 font-bold">{t('copilot.chatHistory.title')}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-gray-800 font-medium mb-1 flex items-center">
              <IconResponse className="h-4 w-4 mr-1" />
              {result?.title}
            </div>
            <p className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">{result?.content ?? ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
