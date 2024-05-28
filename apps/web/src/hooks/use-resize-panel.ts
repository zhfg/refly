import { useLayoutEffect, useState } from "react"

interface ResizePanelProps {
  groupSelector: string
  resizeSelector: string
  initialMinSize: number
  initialMinPixelSize: number
}

export const useResizePanel = (props: ResizePanelProps) => {
  const { groupSelector, resizeSelector, initialMinPixelSize, initialMinSize } =
    props
  const [minSize, setMinSize] = useState(initialMinSize)

  useLayoutEffect(() => {
    const panelGroup = document.querySelector(
      `.${groupSelector}`,
    ) as HTMLElement
    const resizeHandles = document.querySelectorAll(
      `.${resizeSelector}`,
    ) as NodeListOf<HTMLElement>
    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth

      resizeHandles.forEach(resizeHandle => {
        width -= resizeHandle.offsetWidth
      })

      console.log("initialMinPixelSize", width)

      setMinSize((initialMinPixelSize / width) * 100)
    })
    observer.observe(panelGroup)
    resizeHandles.forEach(resizeHandle => {
      observer.observe(resizeHandle)
    })

    return () => {
      observer.unobserve(panelGroup)
      resizeHandles.forEach(resizeHandle => {
        observer.unobserve(resizeHandle)
      })
      observer.disconnect()
    }
  }, [])

  return [minSize]
}
