import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "~assets/digest/empty.svg"
// styles
import "./index.scss"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export const EmptyThreadLibraryStatus = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="empty-digest-container">
      <div className="empty-digest-cover-container">
        <img src={EmptySVG} className="empty-digest-cover" />
      </div>
      <p className="empty-digest-hint">
        {t("translation:threadLibrary.empty.title")}
      </p>
      <div className="empty-digest-action-container">
        <Button
          style={{ marginLeft: 24 }}
          onClick={() => {
            navigate(`/`)
          }}>
          {t("translation:threadLibrary.empty.goHome")}
        </Button>
      </div>
    </div>
  )
}
