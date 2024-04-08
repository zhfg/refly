import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"
import { useNavigate } from "react-router-dom"
import { getCurrentDateInfo } from "@/utils/time"

export const EmptyDigestStatus = () => {
  const navigate = useNavigate()

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">
        今日还未阅读新内容，赶快下载插件去阅读新内容吧~
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
            const { year, day, month } = getCurrentDateInfo()
            navigate(`/digest/daily/${year}/${month}/${day}`)
          }}>
          查看归档
        </Button>
      </div>
    </div>
  )
}
