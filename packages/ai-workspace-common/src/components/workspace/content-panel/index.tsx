import { Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

import { WorkSpaceSearch } from '../work-space-search';
import { ResourceList } from '@refly-packages/ai-workspace-common/components/workspace/resource-list';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';

import './index.scss';

const TabPanel = Tabs.TabPane;

export const ContentPanel = () => {
  const { t } = useTranslation();

  return (
    <div className="content-panel-container">
      <WorkSpaceSearch />
      <Tabs defaultActiveTab="knowledge-resource">
        <TabPanel key="knowledge-resource" title={t('workspace.contentPanel.tabPanel.resource')}>
          <ResourceList />
        </TabPanel>
        <TabPanel key="knowledge-notes" title={t('workspace.contentPanel.tabPanel.note')}>
          <NoteList />
        </TabPanel>
        <TabPanel key="knowledge-collection" title={t('workspace.contentPanel.tabPanel.collection')}>
          <KnowledgeBaseList />
        </TabPanel>
      </Tabs>
    </div>
  );
};
