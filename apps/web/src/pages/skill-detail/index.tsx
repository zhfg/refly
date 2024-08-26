import { useEffect } from "react"
import { ErrorBoundary } from "@sentry/react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { useSearchParams } from "@refly-packages/ai-workspace-common/utils/router"

// components
import SkillDetail from "@refly-packages/ai-workspace-common/components/skill/skill-detail"
import { AICopilot } from "@refly-packages/ai-workspace-common/components/knowledge-base/copilot"

import { useSkillJobForCopilot } from "@refly-packages/ai-workspace-common/stores/skill-job-for-copilot"

import "./index.scss"

const SkillDetailPage = () => {
  const skillJobForCopilot = useSkillJobForCopilot()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get("jobId") as string

  useEffect(() => {
    skillJobForCopilot.setJobId(jobId)
  }, [jobId])

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
          {skillJobForCopilot.jobId && (
            <>
              <PanelResizeHandle
                className="skill-detail-page__panel-resize"
                key="skill-detail-page__panel-resize"
              />
              <Panel
                order={2}
                className="skill-detail-page__copilot"
                {...{
                  defaultSize: 30,
                  minSize: 30,
                  maxSize: 50,
                }}
                key="skill-detail-page__copilot"
                id="skill-detail-page__copilot">
                <AICopilot
                  disable={true}
                  source="skillJob"
                  jobId={skillJobForCopilot.jobId}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </ErrorBoundary>
  )
}

export default SkillDetailPage
