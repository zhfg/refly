import { Button, Tooltip } from 'antd';

// stores
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { IconRefresh } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

export const ResetContentSelectorBtn = () => {
  const contextPanelStore = useContextPanelStoreShallow((state) => ({
    resetSelectedTextCardState: state.resetSelectedTextCardState,
  }));

  const { t } = useTranslation();
  const { handleReset } = useSelectedMark();

  return (
    <Tooltip title={t('knowledgeBase.context.clearContext')} getPopupContainer={getPopupContainer} destroyTooltipOnHide>
      <Button
        size="small"
        type="default"
        className="text-xs h-6 rounded border text-gray-500"
        icon={<IconRefresh />}
        onClick={() => {
          contextPanelStore.resetSelectedTextCardState();
          handleReset();
        }}
      ></Button>
    </Tooltip>
  );
};
