import { useEffect, useRef } from "react"
import { useContentSelectorStore } from "~stores/content-selector"
import { safeParseJSON } from "~utils/parse"
// stores

export const useSelectedMark = () => {
  const contentSelectorStore = useContentSelectorStore()

  // 从 content-selector-app 获取信息，以此和 main-app 解耦合
  const contentSelectedHandler = (event: MessageEvent<any>) => {
    const data = event?.data || {}
    console.log("contentSelectedHandler", event)
    if (data?.name === "syncSelectedMark") {
      const marks = safeParseJSON(data?.payload?.marks)

      contentSelectorStore.setMarks(marks)
    }
  }

  useEffect(() => {
    window.addEventListener("message", contentSelectedHandler)

    return () => {
      document.body.removeEventListener("message", contentSelectedHandler)
    }
  }, [])
}
