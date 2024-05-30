import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"
import { useDigestArchiveStore } from "@/stores/digest-archive"
import { useTranslation } from "react-i18next"

interface EmptyDigestArchiveStatusProps {
  date: { year: string; month: string; day: string }
}

export const EmptyDigestStatus = (props: EmptyDigestArchiveStatusProps) => {
  const {
    date: { year, month, day },
  } = props
  const digestArchiveStore = useDigestArchiveStore()

  const { t } = useTranslation()

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">
        {t("knowledgeLibrary.empty.timelineTitle", { year, month, day })}
      </p>
      <div className="empty-digest-action-container">
        <Button
          onClick={() => {
            window.open(
              `https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd`,
              "_blank",
            )
          }}>
          {t("knowledgeLibrary.empty.download")}
        </Button>
        <Button
          style={{ marginLeft: 24 }}
          onClick={() => {
            digestArchiveStore.updateDatePopupVisible(true)
          }}>
          {t("knowledgeLibrary.empty.seeOther")}
        </Button>
      </div>
    </div>
  )
}
