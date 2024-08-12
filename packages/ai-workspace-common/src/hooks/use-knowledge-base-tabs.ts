import { Message as message } from '@arco-design/web-react';

import { KnowledgeBaseTab, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Resource } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

export const useKnowledgeBaseTabs = () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();

  const tabs = knowledgeBaseStore.tabs;
  const activeTab = knowledgeBaseStore.activeTab;

  const handleAddTabWithResource = (resource?: Partial<Resource>) => {
    const newTab: KnowledgeBaseTab = {
      title: resource?.title || '',
      key: resource?.resourceId || '',
      content: resource?.contentPreview || '',
      collectionId: resource?.collectionId || '',
      resourceId: resource?.resourceId || '',
    };
    handleAddTab(newTab);
  };

  const handleAddTab = (newTab: KnowledgeBaseTab) => {
    const { tabs } = useKnowledgeBaseStore.getState();
    if (tabs?.length === 1 && tabs?.[0]?.key === 'key1') {
      knowledgeBaseStore.updateTabs([newTab]);
    } else {
      if (!tabs?.some((item) => item.key === newTab.key)) {
        knowledgeBaseStore.updateTabs([...tabs, newTab]);
      }
    }

    knowledgeBaseStore.updateActiveTab(newTab.key);
  };

  const handleDeleteTab = (key: string) => {
    const index = tabs.findIndex((x) => x.key === key);
    const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1));

    if (tabs?.length === 1) {
      knowledgeBaseStore.resetTabs();
      jumpToReadResource({
        kbId: '',
        resId: '',
      });
      return;
    }

    if (key === activeTab && index > -1 && newTabs.length) {
      const activeKey = newTabs[index] ? newTabs[index].key : newTabs[index - 1].key;
      knowledgeBaseStore.updateActiveTab(activeKey);
      setActiveTab(activeKey);
    }

    if (index > -1) {
      knowledgeBaseStore.updateTabs(newTabs);
    }
  };

  const handleDeleteTabsWithCollectionId = (collectionId: string) => {
    const newTabs = tabs?.filter((tab) => tab?.collectionId !== collectionId);
    if (newTabs?.length === 0) {
      knowledgeBaseStore.resetTabs();
      jumpToReadResource({
        kbId: '',
        resId: '',
      });
      return;
    }
    knowledgeBaseStore.updateActiveTab(newTabs[0].key);
    setActiveTab(newTabs[0].key);
    knowledgeBaseStore.updateTabs(newTabs);
  };

  const setActiveTab = (key: string) => {
    knowledgeBaseStore.updateActiveTab(key);
    const tab = tabs?.find((tab) => tab?.key === key);

    jumpToReadResource({
      kbId: tab?.collectionId || '',
      resId: tab?.resourceId || '',
    });
  };

  return {
    tabs,
    activeTab,
    handleAddTab,
    handleDeleteTab,
    setActiveTab,
    handleAddTabWithResource,
    handleDeleteTabsWithCollectionId,
  };
};
