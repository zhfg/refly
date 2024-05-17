import { useUserStore } from "@/stores/user"
import { cnGuessQuestions, enGuessQuestions } from "@/utils/guess-question"
import { Avatar, Breadcrumb, Button } from "@arco-design/web-react"
import { useTranslation } from "react-i18next"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// 自定义组件
import { KnowledgeBaseDirectory } from "../directory"
import { KnowledgeBaseResourceDetail } from "../resource-detail"
import { IconMore } from "@arco-design/web-react/icon"
// 样式
import "./index.scss"
import { useResizePanel } from "@/hooks/use-resize-panel"

const BreadcrumbItem = Breadcrumb.Item

export const KnowledgeBaseDetail = () => {
  const [minSize] = useResizePanel({
    groupSelector: "knowledge-base-detail-panel-container",
    resizeSelector: "knowledge-base-detail-panel-resize",
    initialMinSize: 24,
    initialMinPixelSize: 200,
  })

  return (
    <div className="knowledge-base-detail-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <Breadcrumb>
            <BreadcrumbItem href="/">工作台</BreadcrumbItem>
            <BreadcrumbItem
              href={`/knowledge-base/`}
              className="breadcrum-description">
              知识库
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="knowledge-base-detail-menu">
          <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button>
        </div>
      </div>
      <PanelGroup
        direction="horizontal"
        className="knowledge-base-detail-panel-container">
        <Panel
          defaultSize={minSize}
          minSize={minSize}
          maxSize={50}
          className="knowledge-base-detail-directory-panel">
          <KnowledgeBaseDirectory />
        </Panel>
        <PanelResizeHandle className="knowledge-base-detail-panel-resize" />
        <Panel className="knowledge-base-detail-resource-panel" minSize={50}>
          <KnowledgeBaseResourceDetail />
        </Panel>
      </PanelGroup>
    </div>
  )
}
