import { Button, Divider } from "@arco-design/web-react"
import { IconStar } from "@arco-design/web-react/icon"
import { IconTip } from "./icon-tip"
import { useWeblinkStore } from "@/stores/weblink"
import { mapSourceFromWeblinkList } from "@/utils/weblink"
import { useBuildThreadAndRun } from "@/hooks/use-build-thread-and-run"
import { Source } from "@/types"
import { useTranslation } from "react-i18next"

export const QuickAction = () => {
  const { runQuickActionTask } = useBuildThreadAndRun()
  const { t } = useTranslation()

  const handleSummary = () => {
    const { selectedRow } = useWeblinkStore.getState()
    const weblinkList = mapSourceFromWeblinkList(selectedRow)
    runQuickActionTask({
      filter: {
        weblinkList: weblinkList as Source[],
      },
    })
  }

  return (
    <>
      <Divider />
      <div className="selected-weblinks-container">
        <div className="selected-weblinks-inner-container">
          <div className="hint-item">
            <IconStar style={{ color: "rgba(0, 0, 0, .6)" }} />
            <span>
              {t("loggedHomePage.homePage.recommendQuickAction.title")}
            </span>
          </div>
          <IconTip
            text={t(
              "loggedHomePage.homePage.recommendQuickAction.summary.tip.title",
            )}>
            <Button
              onClick={handleSummary}
              style={{ fontSize: 12 }}
              shape="round"
              size="small">
              {t("loggedHomePage.homePage.recommendQuickAction.summary.title")}
            </Button>
          </IconTip>
        </div>
      </div>
    </>
  )
}
