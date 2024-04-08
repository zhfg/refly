import { Button } from "@arco-design/web-react"
// assets
import EmptySVG from "@/assets/digest/empty.svg"
// styles
import "./index.scss"

export const EmptyDigestTopicDetailStatus = (props: { text: string }) => {
  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">{props.text}</p>
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
