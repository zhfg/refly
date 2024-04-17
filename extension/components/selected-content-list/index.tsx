import { Card } from "@arco-design/web-react"
import { IconClose, IconRightCircle } from "@arco-design/web-react/icon"
import { useContentSelector } from "~hooks/use-content-selector"
import { useContentSelectorStore } from "~stores/content-selector"
import type { Mark } from "~types/content-selector"

// assets
import EmptySVG from "~assets/selected-content/empty.svg"
import classNames from "classnames"
import { useEffect } from "react"
import { useSelectedMark } from "~hooks/use-selected-mark"

interface SelectedContentListProps {
  marks: Mark[]
  limitContainer?: boolean // 是否限制高度滚动，用于在会话详情页
}

export const SelectedContentList = (props: SelectedContentListProps) => {
  const { limitContainer = false } = props
  const { marks = [] } = useContentSelectorStore()
  const { handleExit, handleRemoveAll, handleResetState, handleRemoveMark } =
    useSelectedMark()

  // 退出时，清理对应的状态
  useEffect(() => {
    return () => {
      handleResetState()
    }
  }, [])

  return (
    <div
      className={classNames("selected-content-container", {
        "selected-container-limit-container": limitContainer,
      })}>
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
        {marks.map((item, index) => (
          <Card
            key={index}
            style={{ width: "100%" }}
            extra={
              <IconClose
                className="selected-content-item-action"
                onClick={() => handleRemoveMark(item?.xPath)}
              />
            }>
            <span className="selected-content-item">{item?.data}</span>
          </Card>
        ))}
        {marks.length === 0 ? (
          <div className="empty-cover-container">
            <img
              src={EmptySVG}
              className="empty-cover"
              style={limitContainer ? { width: 60 } : { width: 100 }}
            />
            <div>暂无选中内容...</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
