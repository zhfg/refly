import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"
import { useDigestArchiveStore } from "@/stores/digest-archive"

interface EmptyDigestArchiveStatusProps {
  date: { year: string; month: string; day: string }
}

export const EmptyDigestStatus = (props: EmptyDigestArchiveStatusProps) => {
  const {
    date: { year, month, day },
  } = props
  const digestArchiveStore = useDigestArchiveStore()

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">
        {year} 年 {month} 月 {day} 日还未阅读新内容，赶快下载插件去阅读新内容吧~
      </p>
      <div className="empty-digest-action-container">
        <Button
          onClick={() => {
            window.open(
              `https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd`,
              "_blank",
            )
          }}>
          下载插件
        </Button>
        <Button
          style={{ marginLeft: 24 }}
          onClick={() => {
            digestArchiveStore.updateDatePopupVisible(true)
          }}>
          查看其他日期内容
        </Button>
      </div>
    </div>
  )
}
