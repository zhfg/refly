import React, { useEffect } from 'react';
import { Button, Divider, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconDelete, IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { ChevronDown, Pin, PinOff } from 'lucide-react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getResultDisplayContent } from '@refly-packages/ai-workspace-common/components/common/result-display';

// Define props interface
interface ChatHistoryProps {
  // Display control
  isOpen: boolean;
  onClose: () => void;

  // Data
  items: NodeItem[];

  // Mode control
  readonly?: boolean;

  // Cleanup
  onCleanup?: () => void;

  // Actions
  onItemClick?: (item: NodeItem) => void;
  onItemPin?: (item: NodeItem) => void;
  onItemDelete?: (item: NodeItem) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  items,
  readonly = false,
  onCleanup,
  onItemClick,
  onItemPin,
  onItemDelete,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // Sync selected nodes with history items

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onCleanup?.();
    };
  }, []);

  if (!isOpen || items?.length === 0) {
    return null;
  }

  console.log('items', items);

  return (
    <div className="w-full border border-solid border-black/10 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)] max-w-4xl mx-auto p-3 pb-1 space-y-1 rounded-lg bg-white mb-1">
      <div className="text-gray-800 font-bold flex items-center justify-between">
        <div className="flex items-center space-x-1 pl-1">
          <span>{t('copilot.chatHistory.title')}</span>
        </div>
        <div>
          <Button type="text" size="small" icon={<ChevronDown className="w-4 h-4 text-gray-400" />} onClick={onClose} />
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'space-y-1 m-1 py-2 px-3 rounded-lg mb-2 cursor-pointer border-gray-100 hover:bg-gray-100',
                {
                  'border-dashed': item.isPreview,
                  'border-solid bg-gray-100': !item.isPreview,
                },
              )}
              onClick={() => onItemClick(item)}
            >
              <div className="text-gray-800 font-medium mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                  <IconResponse className="h-4 w-4 mr-1" />
                  {item.data.title}
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
                      <Button
                        type="text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemPin?.(item);
                        }}
                        icon={
                          item?.isPreview ? (
                            <Pin className="w-4 h-4 text-gray-400" />
                          ) : (
                            <PinOff className="w-4 h-4 text-gray-400" />
                          )
                        }
                      />
                      <Button
                        type="text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemDelete?.(item);
                        }}
                        icon={<IconDelete className="w-4 h-4 text-gray-400" />}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                {getResultDisplayContent(item.data)}
              </div>
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
