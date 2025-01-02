import React, { useEffect } from 'react';
import { Button, Divider, Tooltip } from 'antd';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { IconDelete, IconResponse } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { Pin, PinOff } from 'lucide-react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getResultDisplayContent } from '@refly-packages/ai-workspace-common/components/common/result-display';
import { useNodePosition } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-position';
import { useNodeSelection } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-selection';
import { CanvasNode, ResponseNodeMeta } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

// Define props interface
interface ChatHistoryProps {
  // Data
  items?: IContextItem[];

  // Mode control
  readonly?: boolean;

  // Cleanup
  onCleanup?: () => void;

  // Actions
  onItemClick?: (item: IContextItem) => void;
  onItemPin?: (item: IContextItem) => void;
  onItemDelete?: (item: IContextItem) => void;
}

const ChatHistoryItem = ({ item, readonly }: { item: IContextItem; readonly?: boolean }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { getNodes } = useReactFlow();
  const { setNodeCenter } = useNodePosition();
  const { setSelectedNode } = useNodeSelection();

  const node = getNodes().find((node) => node.data?.entityId === item.entityId) as CanvasNode<ResponseNodeMeta>;

  const handleItemClick = (item: IContextItem, event: React.MouseEvent) => {
    event.preventDefault();
    if (!item?.entityId || !node) return;

    setNodeCenter(node.id);
    setSelectedNode(node as CanvasNode<any>);
  };

  return (
    <div
      key={`${item.entityId}`}
      className={cn('m-1 py-1 px-2 rounded-lg cursor-pointer border-gray-100 hover:bg-gray-100', {
        'border-dashed': item.isPreview,
        'border-solid bg-gray-100': !item.isPreview,
      })}
      onClick={(e) => handleItemClick(item, e)}
    >
      <div className="text-gray-800 font-medium flex items-center justify-between text-xs">
        <div className="flex items-center whitespace-nowrap overflow-hidden">
          <IconResponse className="h-4 w-4 mr-1" />
          <div className="max-w-[200px] truncate">{item.title}</div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400 text-xs mr-1">
            {time(node?.data?.createdAt, language as LOCALE)
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
                    // TODO
                    e.stopPropagation();
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
                    // TODO
                    e.stopPropagation();
                  }}
                  icon={<IconDelete className="w-4 h-4 text-gray-400" />}
                />
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <div className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
        {getResultDisplayContent(node.data)}
      </div>
    </div>
  );
};

export const ChatHistory: React.FC<ChatHistoryProps> = ({ items, readonly = false, onCleanup }) => {
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onCleanup?.();
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-2 space-y-1 rounded-lg max-h-[200px] overflow-y-auto">
      {items.map((item) => (
        <ChatHistoryItem item={item} readonly={readonly} />
      ))}
    </div>
  );
};
