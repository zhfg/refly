import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"
import { useNavigate } from "react-router-dom"

export const EmptyThreadLibraryStatus = () => {
  const navigate = useNavigate()

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">
        暂无无会话，赶紧下载插件或访问首页提问吧~
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
            navigate(`/`)
          }}>
          去首页搜索或提问
        </Button>
      </div>
    </div>
  )
}
