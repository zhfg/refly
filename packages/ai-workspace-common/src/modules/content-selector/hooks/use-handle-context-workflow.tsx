import { Menu, Message as message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '../hooks/use-selected-mark';
// styles
import { useDocumentStore } from '@refly-packages/ai-workspace-common/stores/document';
// stores
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useEffect } from 'react';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';

export const useHandleContextWorkflow = () => {
  const noteStore = useDocumentStore((state) => ({
    updateCurrentNote: state.updateCurrentCanvas,
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
  const contentSelectorStore = useContentSelectorStore((state) => ({
    setShowContentSelector: state.setShowContentSelector,
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
    } else {
      handleInitContentSelectorListener();
    }
  };

  const handleSidePanelClose = () => {
    handleStopContentSelectorListener();
    const { currentCanvas: currentNote } = useDocumentStore.getState();
    noteStore.updateCurrentNote({ ...currentNote, readOnly: false });
  };

  return {
    handleToggleContentSelector,
    handleSidePanelClose,
  };
};
