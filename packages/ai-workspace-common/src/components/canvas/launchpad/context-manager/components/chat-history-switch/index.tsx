import { Badge, Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { IconHistory } from '@arco-design/web-react/icon';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { useMemo } from 'react';

export const ChatHistorySwitch = (props: {
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  items: NodeItem[];
}) => {
  const { chatHistoryOpen, setChatHistoryOpen, items = [] } = props;
  const { t } = useTranslation();

  const popupContainer = useMemo(() => getPopupContainer(), []);

  const tooltipTitle = useMemo(() => {
    return items?.length > 0 ? t('copilot.chatHistory.title') : '';
  }, [items?.length, t]);

  const buttonClassName = useMemo(() => {
    return cn('text-xs h-6 rounded border text-gray-500 gap-1', {
      'border-green-500 text-green-500': chatHistoryOpen && items?.length > 0,
    });
  }, [chatHistoryOpen, items?.length]);

  const handleClick = useMemo(() => {
    return () => setChatHistoryOpen(!chatHistoryOpen);
  }, [chatHistoryOpen, setChatHistoryOpen]);

  return (
    <Tooltip title={tooltipTitle} mouseEnterDelay={0.1} mouseLeaveDelay={0.1} placement="top" destroyTooltipOnHide>
      <Badge count={items?.length ?? 0} size="small" color="#00968F" style={{ zIndex: 1000 }}>
        <Button
          icon={<IconHistory className="w-4 h-4" />}
          size="small"
          type="default"
          className={buttonClassName}
          onClick={handleClick}
        />
      </Badge>
    </Tooltip>
  );
};
