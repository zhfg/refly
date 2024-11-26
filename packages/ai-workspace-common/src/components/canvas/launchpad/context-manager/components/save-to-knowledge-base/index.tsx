import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Button, Tooltip } from '@arco-design/web-react';
import { IconSave } from '@arco-design/web-react/icon';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useTranslation } from 'react-i18next';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { LOCALE } from '@refly/common-types';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/hooks/use-get-current-selected-text';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';

export const SaveToKnowledgeBase = () => {
  const { t, i18n } = useTranslation();
  const importResourceStore = useImportResourceStore((state) => ({
    setImportResourceModalVisible: state.setImportResourceModalVisible,
    setSelectedMenuItem: state.setSelectedMenuItem,
    setCopiedTextPayload: state.setCopiedTextPayload,
  }));
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
  const { currentResource } = useKnowledgeBaseStore((state) => ({
    currentResource: state.currentResource,
  }));
  const { enableMultiSelect, currentSelectedMark } = contextPanelStore;
  const { handleReset } = useSelectedMark();
  const { finalUsedMarks } = useGetCurrentSelectedMark();

  const locale = i18n?.language || LOCALE.EN;
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  return (
    <Button
      icon={<IconSave />}
      type="outline"
      style={{ fontSize: 10, height: 18, borderRadius: 4 }}
      size="mini"
      onClick={() => {
        importResourceStore.setImportResourceModalVisible(true);
        importResourceStore.setSelectedMenuItem('import-from-paste-text');

        const content = finalUsedMarks.map((mark) => mark.data).join('\n\n');

        let title = '',
          url = '';

        if (!isWeb) {
          title = currentResource?.title;
          url = currentResource?.data?.url;
        }
        // 设置 copiedTextPayload
        importResourceStore.setCopiedTextPayload({ content, title, url });
      }}
      disabled={finalUsedMarks.length === 0}
    >
      {t('copilot.selectedTextCard.save.title')}
    </Button>
  );
};
