import {
  ProjectTab,
  useProjectStore,
  useProjectStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/project';

export const useProjectTabs = () => {
  const projectStore = useProjectStoreShallow((state) => ({
    tabs: state.projectTabs,
    activeTab: state.projectActiveTab,
    setProjectTabs: state.setProjectTabs,
    setProjectActiveTab: state.setProjectActiveTab,
  }));

  const tabsMap = useProjectStore.getState().projectTabs;
  const activeTabMap = useProjectStore.getState().projectActiveTab;

  const handleAddTab = (newTab: ProjectTab) => {
    const tabs = tabsMap[newTab.projectId] || [];
    if (!tabs?.some((tab) => tab.key === newTab.key)) {
      projectStore.setProjectTabs(newTab.projectId, [...tabs, newTab]);
    }
    projectStore.setProjectActiveTab(newTab.projectId, newTab.key);
  };

  const handleDeleteTab = (projectId: string, key: string) => {
    const tabs = tabsMap[projectId] || [];
    const index = tabs.findIndex((x) => x.key === key);
    const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1));
    projectStore.setProjectTabs(projectId, newTabs);

    if (key === activeTabMap[projectId] && index > -1 && newTabs.length) {
      const activeTab = newTabs[index] ? newTabs[index].key : newTabs[index - 1].key;
      projectStore.setProjectActiveTab(projectId, activeTab);
    }
  };

  const handleUpdateTab = (projectId: string, key: string, tab: ProjectTab) => {
    const tabs = tabsMap[projectId] || [];
    const index = tabs.findIndex((x) => x.key === key);
    if (index > -1) {
      const newTabs = [...tabs];
      newTabs[index] = tab;
      projectStore.setProjectTabs(projectId, newTabs);
    }
  };

  const setActiveTab = (projectId: string, key: string) => {
    projectStore.setProjectActiveTab(projectId, key);
  };

  const setProjectTabs = projectStore.setProjectTabs;

  return {
    tabsMap,
    activeTabMap,
    setActiveTab,
    setProjectTabs,
    handleAddTab,
    handleDeleteTab,
    handleUpdateTab,
  };
};
