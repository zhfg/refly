import { Note } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { NoteTab, useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';

export const useNoteTabs = () => {
  const noteStore = useNoteStore();
  const { jumpToNote } = useKnowledgeBaseJumpNewPath();

  const tabs = noteStore.tabs;
  const activeTab = noteStore.activeTab;

  const handleAddTabWithNote = (note?: Partial<Note>) => {
    const newTab: NoteTab = {
      title: note?.title || '',
      key: note?.noteId || '',
      content: note?.contentPreview || '',
      noteId: note?.noteId || '',
    };
    handleAddTab(newTab);
  };

  const handleAddTab = (newTab: NoteTab) => {
    const { tabs } = useNoteStore.getState();
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
    const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1));
    noteStore.updateTabs(newTabs);

    if (newTabs.length === 0 && noteStore.notePanelVisible) {
      jumpToNote({ noteId: '' });
    }

    if (key === activeTab && index > -1 && newTabs.length) {
      const activeTab = newTabs[index] ? newTabs[index].key : newTabs[index - 1].key;
      noteStore.updateActiveTab(activeTab);

      if (noteStore.notePanelVisible) {
        jumpToNote({ noteId: activeTab });
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

    jumpToNote({ noteId: tab?.noteId || '' });
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
