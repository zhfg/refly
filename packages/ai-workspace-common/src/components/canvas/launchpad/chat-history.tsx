import React, { useEffect } from 'react';
import { Button, Divider, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useActionResultStore } from '@refly-packages/ai-workspace-common/stores/action-result';
import { IconDelete, IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { ChevronDown, Pin, PinOff } from 'lucide-react';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { ActionResult } from '@refly/openapi-schema';

export const ChatHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { chatHistoryOpen, setChatHistoryOpen } = useLaunchpadStoreShallow((state) => ({
    chatHistoryOpen: state.chatHistoryOpen,
    setChatHistoryOpen: state.setChatHistoryOpen,
  }));

  const { selectedResultItems, setResultItems, removeResultItem, updateResultItem, clearResultItems } =
    useContextPanelStoreShallow((state) => ({
      selectedResultItems: state.selectedResultItems,
      setResultItems: state.setResultItems,
      removeResultItem: state.removeResultItem,
      updateResultItem: state.updateResultItem,
      clearResultItems: state.clearResultItems,
    }));

  const { nodes, setSelectedNodeByEntity } = useCanvasControl();
  const selectedResultNodes = nodes.filter((node) => node.selected && node.type === 'skillResponse');
  const selectedNodeIds = selectedResultNodes.map((node) => node.id);

  useEffect(() => {
    const { selectedResultItems } = useContextPanelStore.getState();
    const { resultMap } = useActionResultStore.getState();
    const newResultItems = [
      ...selectedResultNodes
        .filter((node) => !selectedResultItems.some((item) => item.resultId === node.data.entityId))
        .map((node) => ({ ...resultMap[node.data.entityId], isPreview: true })),
      ...selectedResultItems.filter((item) => !item.isPreview),
    ];
    setResultItems(newResultItems);
  }, [JSON.stringify(selectedNodeIds)]);

  useEffect(() => {
    const handleResultUpdate = (payload: { resultId: string; payload: ActionResult }) => {
      const { selectedResultItems } = useContextPanelStore.getState();
      const index = selectedResultItems.findIndex((item) => item.resultId === payload.resultId);
      if (index >= 0) {
        updateResultItem({ ...selectedResultItems[index], ...payload.payload });
      }
    };
    actionEmitter.on('updateResult', handleResultUpdate);

    return () => {
      actionEmitter.off('updateResult', handleResultUpdate);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearResultItems();
    };
  }, []);

  if (!chatHistoryOpen) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-200 max-w-4xl mx-auto p-3 pb-1 space-y-2 rounded-lg bg-white mb-1">
      <div className="text-gray-800 font-bold flex items-center justify-between">
        <div className="flex items-center space-x-1 pl-1">
          <span>{t('copilot.chatHistory.title')}</span>
        </div>
        <div>
          <Button
            type="text"
            size="small"
            icon={<ChevronDown className="w-4 h-4 text-gray-400" />}
            onClick={() => setChatHistoryOpen(false)}
          />
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {selectedResultItems?.length > 0 ? (
          selectedResultItems?.map((result, index) => (
            <div
              key={index}
              className={cn(
                'space-y-1 m-1 py-2 px-3 rounded-lg mb-2 cursor-pointer border-gray-100 hover:bg-gray-100',
                {
                  'border-dashed': result.isPreview,
                  'border-solid bg-gray-100': !result.isPreview,
                },
              )}
              onClick={() => setSelectedNodeByEntity({ type: 'skillResponse', entityId: result.resultId })}
            >
              <div className="text-gray-800 font-medium mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                  <IconResponse className="h-4 w-4 mr-1" />
                  {result?.title}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400 text-xs mr-1">
                    {time(result?.createdAt, language as LOCALE)
                      .utc()
                      .fromNow()}
                  </span>
                  <Divider type="vertical" className="h-4" />
                  <Button
                    type="text"
                    size="small"
                    onClick={() => updateResultItem({ ...result, isPreview: !result.isPreview })}
                    icon={
                      result.isPreview ? (
                        <Pin className="w-4 h-4 text-gray-400" />
                      ) : (
                        <PinOff className="w-4 h-4 text-gray-400" />
                      )
                    }
                  />
                  <Button
                    type="text"
                    size="small"
                    onClick={() => removeResultItem(result.resultId)}
                    icon={<IconDelete className="w-4 h-4 text-gray-400" />}
                  />
                </div>
              </div>
              <p className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                {result?.content ?? ''}
              </p>
            </div>
          ))
        ) : (
          <Empty
            className="mb-2 text-xs"
            imageStyle={{ height: 57, width: 69, margin: '4px auto' }}
            description={t('copilot.chatHistory.empty')}
          />
        )}
      </div>
    </div>
  );
};
