import { Tabs } from '@arco-design/web-react';

// 自定义组件
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { ThreadLibrary } from '@refly-packages/ai-workspace-common/components/thread-library';

// 自定义组件
import { IconFolder, IconRobot } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';

const TabPanel = Tabs.TabPane;

export const ContentPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="content-panel-container">
      <Tabs defaultActiveTab="knowledge-collection">
        <TabPanel
          key="knowledge-collection"
          title={
            <span>
              <IconFolder style={{ marginRight: 6 }} />
              知识库
            </span>
          }
        >
          <KnowledgeBaseList
            handleItemClick={(kbId) => {
              navigate(`/knowledge-base?kbId=${kbId}`);
            }}
          />
        </TabPanel>
        {/* <TabPanel
          key="knowledge-resource"
          title={
            <span>
              <IconFolder style={{ marginRight: 6 }} />
              资源库
            </span>
          }>
          <KnowledgeBaseList
            handleItemClick={kbId => {
              navigate(`/knowledge-base?kbId=${kbId}`)
            }}
          />
        </TabPanel> */}
        <TabPanel
          key="thread-library"
          title={
            <span>
              <IconRobot style={{ marginRight: 6 }} />
              会话库
            </span>
          }
        >
          <ThreadLibrary />
        </TabPanel>
      </Tabs>
    </div>
  );
};
