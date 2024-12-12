import React, { useEffect } from 'react';
import { Button, Divider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconDelete, IconReply } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { ChevronDown, Pin, PinOff } from 'lucide-react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getResultDisplayContent } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

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

  const { chatHistoryOpen, setChatHistoryOpen, historyItems, clearHistoryItems, handleItemPin, handleItemDelete } =
    useChatHistory();

  const renderItems = items ?? historyItems;

  // Sync selected nodes with history items

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onCleanup?.();
    };
  }, []);

  const { addSelectedNodeByEntity } = useCanvasControl();
  const handleItemClick = (item: NodeItem) => {
    addSelectedNodeByEntity({ type: 'skillResponse', entityId: item.data.entityId });
  };

  if (!chatHistoryOpen || renderItems?.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-2 space-y-1 rounded-lg max-h-[200px] overflow-y-auto">
      {renderItems.map((item, index) => (
        <div
          key={index}
          className={cn('m-1 py-1 px-2 rounded-lg cursor-pointer border-gray-100 hover:bg-gray-100', {
            'border-dashed': item.isPreview,
            'border-solid bg-gray-100': !item.isPreview,
          })}
          onClick={() => handleItemClick(item)}
        >
          <div className="text-gray-800 font-medium flex items-center justify-between text-xs">
            <span className="flex items-center whitespace-nowrap overflow-hidden">
              <IconReply className="h-4 w-4 mr-1" />
              <div className="max-w-[200px] truncate">{item.data?.title}</div>
            </span>
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
