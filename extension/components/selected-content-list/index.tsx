import { Card } from "@arco-design/web-react"
import { IconRightCircle } from "@arco-design/web-react/icon"
import type { Mark } from "~types/content-selector"

// stores

interface SelectedContentListProps {
  marks: Mark[]
}

export const SelectedContentList = (props: SelectedContentListProps) => {
  const { marks = [] } = props

  return (
    <div className="selected-content-container">
      <div className="selected-content-hint-item">
        <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
        <span>选中要操作的内容如下：</span>
      </div>
      <div className="selected-content-list-container">
        {marks.map((item) => (
          <Card style={{ width: "100%" }} extra={<a>查看全文</a>}>
            <span className="selected-content-item">{item?.data?.[0]}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
