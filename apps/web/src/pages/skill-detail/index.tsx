import { ErrorBoundary } from "@sentry/react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// components
import SkillDetail from "@refly-packages/ai-workspace-common/components/skill/skill-detail"
import { AICopilot } from "@refly-packages/ai-workspace-common/components/knowledge-base/copilot"

import "./index.scss"

const SkillDetailPage = () => {
  return (
    <ErrorBoundary>
      <div className="skill-detail-page">
        <PanelGroup direction="horizontal">
          <Panel
            order={1}
            className="skill-detail-page__detail"
            key="skill-detail-page__detail"
            id="skill-detail-page__detail">
            <SkillDetail />
          </Panel>
          <PanelResizeHandle
            className="skill-detail-page__panel-resize"
            key="skill-detail-page__panel-resize"
          />
          <Panel
            order={2}
            className="skill-detail-page__copilot"
            {...{
              defaultSize: 20,
              minSize: 20,
              maxSize: 50,
            }}
            key="skill-detail-page__copilot"
            id="skill-detail-page__copilot">
            <AICopilot />
          </Panel>
        </PanelGroup>
      </div>
    </ErrorBoundary>
  )
}

export default SkillDetailPage
