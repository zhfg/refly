import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import { useContentSelector } from "~hooks/use-content-selector"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
}

export const getShadowHostId: PlasmoGetShadowHostId = () => `content-selector`

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `.refly-content-selector-mark {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    background-color: #00968F26 !important;
    border-radius: 4px;
  }`
  return style
}

const ContentSelector = () => {
  const { contentSelectorElem } = useContentSelector()

  return <>{contentSelectorElem}</>
}

export default ContentSelector

if (process.env.NODE_ENV === "production") {
  console.log = () => {} // 覆盖console.log为空函数
  console.error = () => {} // 覆盖console.error为空函数
}
