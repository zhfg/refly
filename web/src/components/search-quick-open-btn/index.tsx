import { useQuickSearchStateStore } from "@/stores/quick-search-state"
import { reflyEnv } from "@/utils/env"

import "./index.scss"

export const SearchQuickOpenBtn = () => {
  // stores
  const quickSearchStateStore = useQuickSearchStateStore()

  return (
    <div className="search-quick-open-container">
      <div
        className="search-quick-open-input"
        onClick={() => {
          quickSearchStateStore.setVisible(true)
        }}>
        <div className="search-quick-open-text">新会话</div>
        <div className="search-quick-open-shortcuts">
          <div className="search-quick-open-shortcut-key">
            {reflyEnv.getOsType() === "OSX" ? "⌘" : "ctrl"}
          </div>
          <div className="search-quick-open-shortcut-key search-quick-open-shortcut-key__right">
            K
          </div>
        </div>
      </div>
    </div>
  )
}
