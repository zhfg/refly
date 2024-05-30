import { sendToBackground } from "@plasmohq/messaging"
import classNames from "classnames"
import { useEffect, useRef } from "react"
import type { Mark } from "~types"
import getXPath from "get-xpath"
import { safeStringifyJSON } from "~utils/parse"
// import { getContentFromHtmlSelector } from "~utils/weblink"

function getElementType(element) {
  // 检查元素是否为 table 元素
  if (element.tagName.toLowerCase() === "table") {
    return "table"
  }
  // 检查元素是否为 a 标签(链接)
  else if (element.tagName.toLowerCase() === "a") {
    return "link"
  }
  // 检查元素是否为 img 标签(图像)
  else if (element.tagName.toLowerCase() === "img") {
    return "image"
  }
  // 检查元素是否为 video 标签
  else if (element.tagName.toLowerCase() === "video") {
    return "video"
  }
  // 检查元素是否为 audio 标签
  else if (element.tagName.toLowerCase() === "audio") {
    return "audio"
  }
  // 如果以上都不是,则认为是文本元素
  else {
    return "text"
  }
}

export const useContentSelector = () => {
  const statusRef = useRef(true)
  const markRef = useRef<HTMLDivElement>()
  const targetList = useRef<Element[]>([])
  const markListRef = useRef<Mark[]>([])
  const showContentSelectorRef = useRef<boolean>(false)

  const buildMark = (target: HTMLElement) => {
    const content = target.innerText

    const mark: Mark = {
      type: getElementType(target),
      data: content,
      target,
      xPath: getXPath(target),
    }

    // console.log(
    //   "getContentFromHtmlSelector",
    //   getContentFromHtmlSelector(getCSSPath(target)),
    // )

    return mark
  }

  const addMark = (target: HTMLElement) => {
    const mark = buildMark(target)

    markListRef.current = markListRef.current.concat(mark)
    ;(target as Element)?.classList.add("refly-content-selected-target")
    // 添加到 list 方便后续统一的处理
    targetList.current = targetList.current.concat(target as Element)
  }

  const removeMark = (target: HTMLElement, xPath: string) => {
    markListRef.current = markListRef.current.filter(
      (item) => item.xPath !== xPath,
    )
    ;(target as Element)?.classList.remove("refly-content-selected-target")
    targetList.current = targetList.current.filter((item) => item != target)
  }

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

  const syncMessageResetMarks = () => {
    // 发送给 refly-main-app
    const msg = {
      name: "syncSelectedMark",
      payload: {
        marks: safeStringifyJSON(markListRef.current),
      },
    }
    console.log("contentSelectorClickHandler", safeStringifyJSON(msg))
    window.postMessage(msg)
  }

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
    markListRef.current = []
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

      mark.style.top = window.scrollY + rect.top + "px"
      mark.style.left = window.scrollX + rect.left + "px"
      mark.style.width = rect.width + "px"
      mark.style.height = rect.height + "px"
      mark.style.backgroundColor = `#4d53e826 !important`
    }
  }

  const contentSelectorClickHandler = (ev: MouseEvent) => {
    ev.stopImmediatePropagation()
    ev.preventDefault()
    ev.stopPropagation()

    if (
      statusRef.current &&
      markRef.current &&
      showContentSelectorRef.current
    ) {
      const { target } = ev

      if (
        (target as Element)?.classList.contains("refly-content-selected-target")
      ) {
        removeMark(target as HTMLElement, getXPath(target))
      } else {
        addMark(target as HTMLElement)
      }

      console.log("markListRef.current", markListRef.current)
      // 发送给 refly-main-app
      const msg = {
        name: "syncSelectedMark",
        payload: {
          marks: safeStringifyJSON(
            markListRef.current?.map(({ target, ...extra }) => ({ ...extra })), // 去掉 target，因为会产生循环引用
          ),
        },
      }
      console.log("contentSelectorClickHandler", safeStringifyJSON(msg))
      window.postMessage(msg)
    }
  }

  const contentSelectorStatusHandler = (event: MessageEvent<any>) => {
    const data = event?.data || {}
    if (data?.name === "setShowContentSelector") {
      showContentSelectorRef.current =
        data?.payload?.showContentSelector || false

      if (data?.payload?.showContentSelector) {
        document.body.addEventListener("mousemove", contentActionHandler)
        document.body.addEventListener("click", contentSelectorClickHandler, {
          capture: true,
        })
      } else {
        document.body.removeEventListener(
          "message",
          contentSelectorClickHandler,
        )
        document.body.removeEventListener(
          "click",
          contentSelectorClickHandler,
          { capture: true },
        )
      }

      // 取消的话直接取消 classList
      if (!data?.payload?.showContentSelector) {
        resetStyle()
      }
    }

    if (data?.name === "removeSelectedMark") {
      const xPath = data?.payload?.xPath || ""
      const target = markListRef.current.find(
        (item) => item.xPath === xPath,
      )?.target
      removeMark(target as HTMLElement, xPath)
    }

    if (data?.name === "removeAllSelectedMark") {
      resetStyle()
      syncMessageResetMarks()
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
