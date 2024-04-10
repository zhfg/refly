import { Card } from "@arco-design/web-react"
import type { Mark } from "~types/content-selector"

interface SelectedContentListProps {
  marks: Mark[]
}

export const SelectedContentList = (props: SelectedContentListProps) => {
  const { marks = [] } = props
  return (
    <div className="selected-content-container">
      {marks.map((item) => (
        <Card style={{ width: "100%" }} extra={<a>查看全文</a>}>
          <span className="selected-content-item">{item?.data?.[0]}</span>
        </Card>
      ))}
    </div>
  )
}
