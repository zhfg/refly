import { Tabs } from "@arco-design/web-react"

// 自定义组件
import { KnowledgeBaseList } from "@/components/knowledge-base-list"
import { ThreadLibrary } from "@/components/thread-library"

// 自定义组件
import { IconFolder, IconRobot } from "@arco-design/web-react/icon"

const TabPanel = Tabs.TabPane

export const ContentPanel = () => {
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
          }>
          <KnowledgeBaseList />
        </TabPanel>
        <TabPanel
          key="knowledge-resource"
          title={
            <span>
              <IconFolder style={{ marginRight: 6 }} />
              资源库
            </span>
          }>
          <KnowledgeBaseList />
        </TabPanel>
        <TabPanel
          key="thread-library"
          title={
            <span>
              <IconRobot style={{ marginRight: 6 }} />
              会话库
            </span>
          }>
          <ThreadLibrary />
        </TabPanel>
      </Tabs>
    </div>
  )
}
