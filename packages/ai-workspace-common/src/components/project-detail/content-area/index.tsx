import { Tabs } from 'antd';
import { Button, Tooltip } from '@arco-design/web-react';

import { ResourceView } from '../resource-view';

import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';

import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

import './index.scss';
import { CanvasEditor } from '@refly-packages/ai-workspace-common/components/project-detail/canvas';

export const ContentArea = (props: { projectId: string }) => {
  const { projectId } = props;
  const { t } = useTranslation();

  const { tabsMap, activeTabMap, setActiveTab, handleDeleteTab } = useProjectTabs();
  const tabs = tabsMap[projectId] || [];
  console.log('tabs', tabs);
  const activeTab = tabs.find((x) => x.key === activeTabMap[projectId]);
  console.log('activeTab', activeTab);

  const searchStore = useSearchStoreShallow((state) => ({
    pages: state.pages,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const tabItems = tabs.map((item) => ({
    key: item.key,
    label: item.title,
  }));

  const onChange = (newActiveKey: string) => {
    if (projectId) {
      setActiveTab(projectId, newActiveKey);
    }
  };

  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'add') {
      console.log('add');
    } else {
      handleDeleteTab(projectId, targetKey as string);
    }
  };

  return (
    <div className="knowledge-base-detail-container flex flex-col">
      <Tabs
        className="knowledge-base-detail-tab-container"
        animated
        type="editable-card"
        size="middle"
        items={tabItems}
        activeKey={activeTab?.key}
        onChange={onChange}
        onEdit={onEdit}
        tabBarExtraContent={
          <Tooltip content={t('knowledgeBase.header.searchAndOpenResourceOrCollection')}>
            <Button
              icon={<IconSearch />}
              type="text"
              className="assist-action-item-header"
              onClick={() => {
                searchStore.setPages(searchStore.pages.concat('readResources'));
                searchStore.setIsSearchOpen(true);
              }}
            />
          </Tooltip>
        }
      />
      <div className="flex-grow overflow-auto">
        {activeTab?.type === 'canvas' ? (
          <CanvasEditor projectId={projectId} canvasId={activeTab?.key} />
        ) : (
          <ResourceView projectId={projectId} resourceId={activeTab?.key} />
        )}
      </div>
    </div>
  );
};
