import { Badge, Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { IResultItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { IconHistory } from '@arco-design/web-react/icon';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';

export const ChatHistorySwitch = (props: {
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  items: IResultItem[];
}) => {
  const { chatHistoryOpen, setChatHistoryOpen, items } = props;
  const { t } = useTranslation();

  return (
    <Badge count={items?.length} size="small" color="#00968F" style={{ zIndex: 1000 }}>
      <Tooltip title={items?.length > 0 ? t('copilot.chatHistory.title') : ''} getPopupContainer={getPopupContainer}>
        <Button
          icon={<IconHistory className="w-4 h-4" />}
          size="small"
          type="default"
          className={cn('text-xs h-6 rounded border text-gray-500 gap-1', {
            'border-green-500 text-green-500': chatHistoryOpen,
          })}
          onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
        />
      </Tooltip>
    </Badge>
  );
};
