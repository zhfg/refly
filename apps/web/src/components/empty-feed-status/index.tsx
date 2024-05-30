import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"

export const EmptyFeedStatus = () => {
  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">
        暂时无符合你兴趣的内容推荐，多尝试阅读一些内容可以让小飞更懂你哦~
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
      </div>
    </div>
  )
}
