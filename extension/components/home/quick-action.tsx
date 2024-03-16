import { Button, Divider } from "@arco-design/web-react"
import { IconStar } from "@arco-design/web-react/icon"
import { IconTip } from "./icon-tip"
import { useWeblinkStore } from "~stores/weblink"
import { mapSourceFromWeblinkList } from "~utils/weblink"
import { useBuildThreadAndRun } from "~hooks/use-build-thread-and-run"
import { SearchTarget } from "~stores/search-state"

export const QuickAction = () => {
  const { selectedRow } = useWeblinkStore()
  const { runQuickActionTask } = useBuildThreadAndRun()

  const handleSummary = () => {
    const weblinkList = mapSourceFromWeblinkList(selectedRow)
    runQuickActionTask(
      {
        filter: {
          weblinkList,
        },
      },
      SearchTarget.SelectedPages,
    )
  }

  return (
    <>
      <Divider />
      <div className="selected-weblinks-container">
        <div className="selected-weblinks-inner-container">
          <div className="hint-item">
            <IconStar style={{ color: "rgba(0, 0, 0, .6)" }} />
            <span>推荐操作：</span>
          </div>
          <IconTip text="对选中的网页进行总结">
            <Button
              onClick={handleSummary}
              style={{ fontSize: 12 }}
              shape="round"
              size="small">
              总结
            </Button>
          </IconTip>
        </div>
      </div>
    </>
  )
}
