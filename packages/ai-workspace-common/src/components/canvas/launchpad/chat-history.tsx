import React, { useEffect } from 'react';
import { Button, Divider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconDelete, IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { Pin, PinOff } from 'lucide-react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { NodeItem, useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getResultDisplayContent } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';
import { useNodePosition } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-position';
import { useNodeSelection } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-selection';

// Define props interface
interface ChatHistoryProps {
  // Data
  items?: NodeItem[];

  // Mode control
  readonly?: boolean;

  // Cleanup
  onCleanup?: () => void;

  // Actions
  onItemClick?: (item: NodeItem) => void;
  onItemPin?: (item: NodeItem) => void;
  onItemDelete?: (item: NodeItem) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ items, readonly = false, onCleanup }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { setNodeCenter } = useNodePosition();
  const { removeContextItem } = useContextPanelStoreShallow((state) => ({
    removeContextItem: state.removeContextItem,
  }));
  const { chatHistoryOpen, historyItems, clearHistoryItems, handleItemPin, handleItemDelete } = useChatHistory();

  const renderItems = items ?? historyItems;

  // Sync selected nodes with history items

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onCleanup?.();
    };
  }, []);

  const { setSelectedNodeByEntity } = useNodeSelection();
  const handleItemClick = (item: NodeItem, event: React.MouseEvent) => {
    event.preventDefault();
    if (!item?.id || !item?.data?.entityId) return;

    setNodeCenter(item.id);
    setSelectedNodeByEntity({
      type: 'skillResponse',
      entityId: item.data.entityId,
    });
  };

  // Add validation for renderItems
  const validItems = (renderItems || []).filter((item) => item && typeof item === 'object' && item.data);

  if (!chatHistoryOpen || validItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-2 space-y-1 rounded-lg max-h-[200px] overflow-y-auto">
      {validItems.map((item, index) => (
        <div
          key={`${item.id || index}`}
          className={cn('m-1 py-1 px-2 rounded-lg cursor-pointer border-gray-100 hover:bg-gray-100', {
            'border-dashed': item.isPreview,
            'border-solid bg-gray-100': !item.isPreview,
          })}
          onClick={(e) => handleItemClick(item, e)}
        >
          <div className="text-gray-800 font-medium flex items-center justify-between text-xs">
            <div className="flex items-center whitespace-nowrap overflow-hidden">
              <IconResponse className="h-4 w-4 mr-1" />
              <div className="max-w-[200px] truncate">{item.data?.title}</div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 text-xs mr-1">
                {time(item.data.createdAt, language as LOCALE)
                  ?.utc()
                  ?.fromNow()}
              </span>
              {!readonly && (
                <>
                  <Divider type="vertical" className="h-4" />
                  <Tooltip
                    destroyTooltipOnHide
                    title={item?.isPreview ? t('canvas.launchpad.pinChat') : t('canvas.launchpad.unpinChat')}
                  >
                    <Button
                      type="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemPin(item);
                      }}
                      icon={
                        item?.isPreview ? (
                          <Pin className="w-4 h-4 text-gray-400" />
                        ) : (
                          <PinOff className="w-4 h-4 text-gray-400" />
                        )
                      }
                    />
                  </Tooltip>

                  <Tooltip destroyTooltipOnHide title={t('canvas.launchpad.removeChat')}>
                    <Button
                      type="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemDelete(item);
                        removeContextItem(item.id);
                      }}
                      icon={<IconDelete className="w-4 h-4 text-gray-400" />}
                    />
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          <div className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
            {getResultDisplayContent(item.data)}
          </div>
        </div>
      ))}
    </div>
  );
};
