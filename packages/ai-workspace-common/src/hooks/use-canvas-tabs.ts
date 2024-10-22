import { Canvas } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { CanvasTab, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

export const useCanvasTabs = () => {
  const noteStore = useCanvasStoreShallow((state) => ({
    tabs: state.tabs,
    activeTab: state.activeTab,
    updateTabs: state.updateTabs,
    updateActiveTab: state.updateActiveTab,
    notePanelVisible: state.canvasPanelVisible,
  }));
  const { jumpToCanvas } = useKnowledgeBaseJumpNewPath();

  const tabs = noteStore.tabs;
  const activeTab = noteStore.activeTab;

  const handleAddTabWithNote = (canvas?: Partial<Canvas>) => {
    const newTab: CanvasTab = {
      title: canvas?.title || '',
      key: canvas?.canvasId || '',
      content: canvas?.contentPreview || '',
      canvasId: canvas?.canvasId || '',
      // @ts-ignore
      projectId: canvas?.projectId, // TODO: 这里需要补充 canvas 的 projectId
    };
    handleAddTab(newTab);
  };

  const handleAddTab = (newTab: CanvasTab) => {
    const tabs = noteStore.tabs;
    if (tabs?.length === 1 && tabs?.[0]?.key === 'key1') {
      noteStore.updateTabs([newTab]);
    } else {
      if (!tabs?.some((item) => item.key === newTab.key)) {
        noteStore.updateTabs([...tabs, newTab]);
      }
    }

    noteStore.updateActiveTab(newTab.key);
  };

  const handleDeleteTab = (key: string) => {
    const index = tabs.findIndex((x) => x.key === key);
    const tab = tabs[index];
    const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1));
    noteStore.updateTabs(newTabs);

    if (newTabs.length === 0 && noteStore.notePanelVisible) {
      jumpToCanvas({ canvasId: '', projectId: tab?.projectId || '' });
    }

    if (key === activeTab && index > -1 && newTabs.length) {
      const activeTab = newTabs[index] ? newTabs[index].key : newTabs[index - 1].key;
      noteStore.updateActiveTab(activeTab);

      if (noteStore.notePanelVisible) {
        jumpToCanvas({ canvasId: activeTab, projectId: tab?.projectId || '' });
      }
    }
  };

  const handleUpdateTabTitle = (key: string, title: string) => {
    const index = tabs.findIndex((x) => x.key === key);
    if (index > -1) {
      const newTabs = [...tabs];
      newTabs[index].title = title;
      noteStore.updateTabs(newTabs);
    }
  };

  const setActiveTab = (key: string) => {
    noteStore.updateActiveTab(key);
    const tab = tabs?.find((tab) => tab?.key === key);

    jumpToCanvas({ canvasId: tab?.canvasId || '', projectId: tab?.projectId || '' });
  };

  return {
    tabs,
    activeTab,
    setActiveTab,
    handleAddTab,
    handleDeleteTab,
    handleAddTabWithNote,
    handleUpdateTabTitle,
  };
};
