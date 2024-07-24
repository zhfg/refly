import { Tabs } from '@arco-design/web-react';

// 自定义组件
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { ThreadLibrary } from '@refly-packages/ai-workspace-common/components/thread-library';
import { WorkSpaceSearch } from '../work-space-search';
import { ResourceBase } from '../resource-base';

// 自定义组件
import { IconFolder, IconRobot } from '@arco-design/web-react/icon';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import './index.scss';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

const TabPanel = Tabs.TabPane;

export const ContentPanel = () => {
  const navigate = useNavigate();
  const { jumpToKnowledgeBase, jumpToNote, jumpToReadResource, jumpToConv } = useKnowledgeBaseJumpNewPath();

  return (
    <div className="content-panel-container">
      <WorkSpaceSearch />
      <Tabs defaultActiveTab="knowledge-resource">
        <TabPanel key="knowledge-resource" title={<span>资源</span>}>
          <ResourceBase
            handleItemClick={(kbId, resId) => {
              jumpToReadResource({
                kbId,
                resId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="knowledge-notes" title={<span>笔记</span>}>
          <KnowledgeBaseList
            handleItemClick={(noteId) => {
              jumpToNote({
                noteId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="knowledge-collection" title={<span>知识库</span>}>
          <KnowledgeBaseList
            handleItemClick={(kbId) => {
              jumpToKnowledgeBase({
                kbId,
              });
            }}
          />
        </TabPanel>
        <TabPanel key="thread-library" title={<span>会话</span>}>
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
