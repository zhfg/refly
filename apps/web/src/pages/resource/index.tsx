import { Helmet } from "react-helmet"
import { ErrorBoundary } from "@sentry/react"

import "./index.scss"
import { useTranslation } from "react-i18next"
import { ResourceDetail2 } from "@refly-packages/ai-workspace-common/components/resource-detail"

const ResourceLayout = () => {
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
          <ResourceDetail2 />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ResourceLayout
