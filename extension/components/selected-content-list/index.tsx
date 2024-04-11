import { Card } from "@arco-design/web-react"
import { IconRightCircle } from "@arco-design/web-react/icon"
import { useContentSelector } from "~hooks/use-content-selector"
import { useContentSelectorStore } from "~stores/content-selector"
import type { Mark } from "~types/content-selector"

// assets
import EmptySVG from "~assets/selected-content/empty.svg"

interface SelectedContentListProps {
  marks: Mark[]
}

export const SelectedContentList = (props: SelectedContentListProps) => {
  const {
    marks = [],
    setMarks,
    setShowSelectedMarks,
  } = useContentSelectorStore()

  const handleRemoveMark = (xPath: string) => {
    window.postMessage({
      name: "removeSelectedMark",
      payload: {
        xPath,
      },
    })

    const { marks } = useContentSelectorStore.getState()
    const newMarks = marks.filter((item) => item?.xPath !== xPath)
    setMarks(newMarks)
  }

  const handleRemoveAll = () => {
    window.postMessage({
      name: "removeAllSelectedMark",
    })
  }

  const handleExit = () => {
    handleRemoveAll()

    setShowSelectedMarks(false)
  }

  return (
    <div className="selected-content-container">
      <div className="selected-content-hint-item">
        <div className="selected-content-left-hint">
          <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
          <span>选中要操作的内容如下：</span>
        </div>
        <div className="selected-content-right-hint">
          {marks?.length > 0 ? (
            <span onClick={() => handleRemoveAll()} style={{ marginRight: 12 }}>
              清空所有选中
            </span>
          ) : null}
          <span onClick={() => handleExit()}>退出</span>
        </div>
      </div>
      <div className="selected-content-list-container">
        {marks.map((item) => (
          <Card
            style={{ width: "100%" }}
            extra={
              <span onClick={() => handleRemoveMark(item?.xPath)}>
                取消选中
              </span>
            }>
            <span className="selected-content-item">{item?.data?.[0]}</span>
          </Card>
        ))}
        {marks.length === 0 ? (
          <div className="empty-cover-container">
            <img src={EmptySVG} className="empty-cover" />
            <div>暂无选中内容...</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
