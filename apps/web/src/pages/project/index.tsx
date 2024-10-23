import { Helmet } from "react-helmet"

import { ProjectDetail } from "@refly-packages/ai-workspace-common/components/project-detail"
import { useTranslation } from "react-i18next"
import { ErrorBoundary } from "@sentry/react"

import "./index.scss"

const ProjectLayout = () => {
  const { t } = useTranslation()

  return (
    <ErrorBoundary>
      <div className="project-container" style={{}}>
        <Helmet>
          <title>
            {t("productName")} | {t("landingPage.slogan")}
          </title>
          <meta name="description" content={t("landingPage.description")} />
        </Helmet>
        <div className="project-inner-container">
          <ProjectDetail />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ProjectLayout
