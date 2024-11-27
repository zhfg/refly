import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useActionResultStore } from '@refly-packages/ai-workspace-common/stores/action-result';
import { IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';

export const ChatHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { selectedResultItems, addResultItem, removeResultItem, removePreviewResultItem, clearResultItems } =
    useContextPanelStoreShallow((state) => ({
      selectedResultItems: state.selectedResultItems,
      addResultItem: state.addResultItem,
      removeResultItem: state.removeResultItem,
      removePreviewResultItem: state.removePreviewResultItem,
      clearResultItems: state.clearResultItems,
    }));
  const { nodes } = useCanvasControl();
  const selectedResultNodes = nodes.filter((node) => node.selected && node.type === 'skillResponse');
  const selectedNodeIds = selectedResultNodes.map((node) => node.id);

  useEffect(() => {
    if (selectedResultNodes?.length > 0) {
      removePreviewResultItem();

      selectedResultNodes.forEach((node) => {
        const result = useActionResultStore.getState().resultMap[node.data.entityId];
        if (!result) {
          return;
        }

        addResultItem({ ...result, isPreview: true });
      });
    } else {
      removePreviewResultItem();
    }
  }, [JSON.stringify(selectedNodeIds)]);

  useEffect(() => {
    return () => {
      clearResultItems();
    };
  }, []);

  if (!selectedResultItems?.length) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-200 max-w-4xl mx-auto p-3 pb-1 space-y-2 rounded-lg bg-white mb-1">
      <p className="text-gray-800 font-bold">{t('copilot.chatHistory.title')}</p>
      <div className="max-h-[200px] overflow-y-auto">
        {selectedResultItems?.map((result, index) => (
          <div key={index} className="space-y-1 m-1 py-2 px-3 bg-gray-50 rounded-lg mb-2">
            <div className="text-gray-800 font-medium mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center">
                <IconResponse className="h-4 w-4 mr-1" />
                {result?.title}
              </span>
              <span className="text-gray-400 text-xs">
                {time(result?.createdAt, language as LOCALE)
                  .utc()
                  .fromNow()}
              </span>
            </div>
            <p className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
              {result?.content ?? ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
