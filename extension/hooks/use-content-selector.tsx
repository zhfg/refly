import { sendToBackground } from "@plasmohq/messaging"
import classNames from "classnames"
import { useEffect, useRef } from "react"
import getXPath from "get-xpath"

export const useContentSelector = () => {
  const statusRef = useRef(true)
  const markRef = useRef<HTMLDivElement>()
  const targetList = useRef<Element[]>([])
  const showContentSelectorRef = useRef<boolean>(false)

  const contentSelectorElem = (
    <div className="refly-content-selector-container">
      <div
        ref={markRef}
        style={{
          backgroundColor: "#4d53e826 !important",
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: "none",
        }}
        className={classNames(
          "refly-content-selector-mark",
          "refly-content-selector-mark--active",
        )}></div>
    </div>
  )

  const resetStyle = () => {
    // mark style
    const mark = markRef.current

    mark.style.top = "0px"
    mark.style.left = "0px"
    mark.style.width = "0px"
    mark.style.height = "0px"

    // selected list style
    targetList.current.forEach((item) =>
      item?.classList?.remove("refly-content-selected-target"),
    )
  }

  const contentActionHandler = (ev: MouseEvent) => {
    ev.stopImmediatePropagation()

    if (
      statusRef.current &&
      markRef.current &&
      showContentSelectorRef.current
    ) {
      const { target } = ev
      const rect = (target as Element)?.getBoundingClientRect()
      const mark = markRef.current

      console.log("target xPath", getXPath(target))

      mark.style.top = window.scrollY + rect.top + "px"
      mark.style.left = window.scrollX + rect.left + "px"
      mark.style.width = rect.width + "px"
      mark.style.height = rect.height + "px"
      mark.style.backgroundColor = `#4d53e826 !important`
    }
  }

  const contentSelectorClickHandler = (ev: MouseEvent) => {
    ev.stopImmediatePropagation()

    if (
      statusRef.current &&
      markRef.current &&
      showContentSelectorRef.current
    ) {
      const { target } = ev

      if (
        (target as Element)?.classList.contains("refly-content-selected-target")
      ) {
        ;(target as Element)?.classList.remove("refly-content-selected-target")

        targetList.current = targetList.current.filter((item) => item != target)
      } else {
        ;(target as Element)?.classList.add("refly-content-selected-target")
        // 添加到 list 方便后续统一的处理
        targetList.current = targetList.current.concat(target as Element)
      }
    }
  }

  const contentSelectorStatusHandler = (event: MessageEvent<any>) => {
    const data = event?.data || {}
    if (data?.name === "setShowContentSelector") {
      showContentSelectorRef.current =
        data?.payload?.showContentSelector || false

      if (data?.payload?.showContentSelector) {
        document.body.addEventListener("mousemove", contentActionHandler)
        document.body.addEventListener("click", contentSelectorClickHandler)
      } else {
        document.body.removeEventListener(
          "message",
          contentSelectorClickHandler,
        )
        document.body.removeEventListener("click", contentSelectorClickHandler)
      }

      // 取消的话直接取消 classList
      if (!data?.payload?.showContentSelector) {
        resetStyle()
      }
    }
  }

  useEffect(() => {
    window.addEventListener("message", contentSelectorStatusHandler)

    return () => {
      document.body.removeEventListener(
        "mousemove",
        contentSelectorStatusHandler,
      )
      document.body.removeEventListener("message", contentSelectorClickHandler)
      document.body.removeEventListener("click", contentSelectorClickHandler)
    }
  }, [])

  return {
    contentSelectorElem,
  }
}
