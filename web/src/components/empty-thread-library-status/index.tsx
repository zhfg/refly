import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export const EmptyThreadLibraryStatus = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">{t("threadLibrary.empty.title")}</p>
      <div className="empty-digest-action-container">
        <Button
          onClick={() => {
            window.open(
              `https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd`,
              "_blank",
            )
          }}>
          {t("threadLibrary.empty.download")}
        </Button>
        <Button
          style={{ marginLeft: 24 }}
          onClick={() => {
            navigate(`/`)
          }}>
          {t("threadLibrary.empty.goHome")}
        </Button>
      </div>
    </div>
  )
}
