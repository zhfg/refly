import { Button, Message, Tooltip } from '@arco-design/web-react';

// stores
import {
  useContextPanelStore,
  selectedTextCardDomainWeb,
  selectedTextCardDomainExtension,
  defaultSelectedTextCardDomainKeysWeb,
  defaultSelectedTextCardDomainKeysExtension,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { IconRefresh } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

export const ResetContentSelectorBtn = () => {
  const contextPanelStore = useContextPanelStore((state) => ({
    enableMultiSelect: state.enableMultiSelect,
    currentSelectedMarks: state.currentSelectedMarks,
    currentSelectedMark: state.currentSelectedMark,
    resetSelectedTextCardState: state.resetSelectedTextCardState,
    updateCurrentSelectedMark: state.updateCurrentSelectedMark,
    setSelectedTextCardDomain: state.setSelectedTextCardDomain,
    selectedTextCardDomain: state.selectedTextCardDomain,
    updateEnableMultiSelect: state.updateEnableMultiSelect,
    updateCurrentSelectedMarks: state.updateCurrentSelectedMarks,
    setShowContextCard: state.setShowContextCard,
    beforeSelectionNoteContent: state.beforeSelectionNoteContent,
    afterSelectionNoteContent: state.afterSelectionNoteContent,
    currentSelectionContent: state.currentSelectionContent,
  }));

  const { t } = useTranslation();
  const { handleReset } = useSelectedMark();

  return (
    <Tooltip content={t('knowledgeBase.context.clearContext')} getPopupContainer={getPopupContainer}>
      <Button
        size="mini"
        type="outline"
        className="text-xs h-6 rounded border border-gray-300"
        style={{ borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
        icon={<IconRefresh />}
        onClick={() => {
          contextPanelStore.resetSelectedTextCardState();
          handleReset();
        }}
      ></Button>
    </Tooltip>
  );
};
