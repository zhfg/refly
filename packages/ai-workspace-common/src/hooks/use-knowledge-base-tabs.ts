import { Message as message } from '@arco-design/web-react';

import { KnowledgeBaseTab, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { ResourceDetail } from '@refly-packages/ai-workspace-common/types';
import { useNavigate } from 'react-router-dom';

export const useKnowledgeBaseTabs = () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const navigate = useNavigate();

  const tabs = knowledgeBaseStore.tabs;
  const activeTab = knowledgeBaseStore.activeTab;

  const handleAddTabWithResource = (resource?: Partial<ResourceDetail>) => {
    const newTab: KnowledgeBaseTab = {
      title: resource?.title || '',
      key: resource?.resourceId || '',
      content: resource?.description || '',
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
      message.warning('至少保留一个标签页！');
      return;
    }

    if (key === activeTab && index > -1 && newTabs.length) {
      knowledgeBaseStore.updateActiveTab(newTabs[index] ? newTabs[index].key : newTabs[index - 1].key);
    }

    if (index > -1) {
      knowledgeBaseStore.updateTabs(newTabs);
    }
  };

  const setActiveTab = (key: string) => {
    knowledgeBaseStore.updateActiveTab(key);
    const tab = tabs?.find((tab) => tab?.key === key);

    navigate(`/knowledge-base?kbId=${tab?.collectionId}&resId=${tab?.resourceId}`);
  };

  return {
    tabs,
    activeTab,
    handleAddTab,
    handleDeleteTab,
    setActiveTab,
    handleAddTabWithResource,
  };
};
