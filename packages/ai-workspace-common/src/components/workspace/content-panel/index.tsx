import { Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

// 自定义组件
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { ThreadLibrary } from '@refly-packages/ai-workspace-common/components/thread-library';
import { WorkSpaceSearch } from '../work-space-search';
import { ResourceBase } from '../resource-base';

// 自定义组件
import './index.scss';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';

const TabPanel = Tabs.TabPane;

export const ContentPanel = () => {
  const { t } = useTranslation();
  const { jumpToKnowledgeBase, jumpToNote, jumpToReadResource, jumpToConv } = useKnowledgeBaseJumpNewPath();

  return (
    <div className="content-panel-container">
      <WorkSpaceSearch />
      <Tabs defaultActiveTab="knowledge-resource">
        <TabPanel key="knowledge-resource" title={t('workspace.contentPanel.tabPanel.resource')}>
          <ResourceBase
            handleItemClick={(kbId, resId) => {
              jumpToReadResource({
                kbId,
                resId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="knowledge-notes" title={t('workspace.contentPanel.tabPanel.note')}>
          <NoteList
            handleItemClick={(noteId) => {
              jumpToNote({
                noteId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="knowledge-collection" title={t('workspace.contentPanel.tabPanel.collection')}>
          <KnowledgeBaseList
            handleItemClick={(kbId) => {
              jumpToKnowledgeBase({
                kbId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="thread-library" title={t('workspace.contentPanel.tabPanel.thread')}>
          <ThreadLibrary
            handleItemClick={(convId) => {
              jumpToConv({
                convId,
              });
            }}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
