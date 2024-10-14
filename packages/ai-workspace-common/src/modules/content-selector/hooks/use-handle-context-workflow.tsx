import { Menu, Message as message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '../hooks/use-selected-mark';
// styles
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
// stores
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useEffect } from 'react';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const useHandleContextWorkflow = () => {
  const noteStore = useNoteStore((state) => ({
    updateCurrentNote: state.updateCurrentNote,
  }));
  const { setShowContextCard, setContextDomain } = useContextPanelStore((state) => ({
    enableMultiSelect: state.enableMultiSelect,
    currentSelectedMarks: state.currentSelectedMarks,
    currentSelectedMark: state.currentSelectedMark,
    setShowContextCard: state.setShowContextCard,
    showContextCard: state.showContextCard,
    contextDomain: state.contextDomain,
    setContextDomain: state.setContextDomain,
  }));
  const runtime = getRuntime();

  // 设置 selected-mark 的监听器
  const { handleInitContentSelectorListener, handleStopContentSelectorListener, initMessageListener } =
    useSelectedMark();
  const { t } = useTranslation();

  // for open or close content selector
  const handleToggleContentSelector = async (showContentSelector: boolean) => {
    // 这里需要切换一下对应的 searchTarget

    if (!showContentSelector) {
      handleStopContentSelectorListener();

      // 将 note 切入只读模式
      // const { currentNote } = useNoteStore.getState();
      // noteStore.updateCurrentNote({ ...currentNote, readOnly: false });
      // message.info(runtime === 'web' ? t('copilot.contentSelector.closeForWeb') : t('copilot.contentSelector.close'));
    } else {
      handleInitContentSelectorListener();

      // 将 note 切入只读模式
      // const { currentNote } = useNoteStore.getState();
      // noteStore.updateCurrentNote({ ...currentNote, readOnly: true });
      // message.info(runtime === 'web' ? t('copilot.contentSelector.openForWeb') : t('copilot.contentSelector.open'));
    }
  };

  // for open or close content selector
  const handleToggleContentSelectorPanel = (showSelectedTextCard: boolean) => {
    setShowContextCard(showSelectedTextCard);

    // 如果是激活文本，
    setContextDomain('selected-text');
  };

  const handlePassthroughOpenContentSelector = (enable = true) => {
    handleToggleContentSelectorPanel(enable);
    handleToggleContentSelector(enable);
  };

  const handleSidePanelClose = () => {
    handleStopContentSelectorListener();
    const { currentNote } = useNoteStore.getState();
    noteStore.updateCurrentNote({ ...currentNote, readOnly: false });
  };

  return {
    handleToggleContentSelector,
    handleToggleContentSelectorPanel,
    handlePassthroughOpenContentSelector,
    handleSidePanelClose,
  };
};
