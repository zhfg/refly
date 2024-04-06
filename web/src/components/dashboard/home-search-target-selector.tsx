import { Button, Dropdown, Menu } from "@arco-design/web-react"
import {
  IconOriginalSize,
  IconArchive,
  IconCommon,
} from "@arco-design/web-react/icon"

import { useSearchStateStore, SearchTarget } from "@/stores/search-state"
import { useWeblinkStore } from "@/stores/weblink"
import { IconTip } from "./icon-tip"
import { useEffect } from "react"

export const SearchTargetSelector = () => {
  const searchStateStore = useSearchStateStore()
  const webLinkStore = useWeblinkStore()

  const iconStyle = {
    marginRight: 8,
    fontSize: 16,
    transform: "translateY(1px)",
  }
  const searchTargetDropList = (
    <Menu
      className="search-target-selector"
      onClickMenuItem={key => {
        console.log("trigger menu", key)
        searchStateStore.setSearchTarget(key as SearchTarget)

        // 如果不是选择历史页面，那么情况选择的 Row
        if (key !== SearchTarget.SelectedPages) {
          webLinkStore.updateSelectedRow([])
        }
      }}>
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        所有网页
      </Menu.Item>
      <Menu.Item
        key={SearchTarget.SelectedPages}
        onClick={() => {
          webLinkStore.updateIsWebLinkListVisible(true)
        }}>
        <IconArchive style={iconStyle} />
        历史已阅读
      </Menu.Item>
    </Menu>
  )

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return "历史已阅读"
      case SearchTarget.All:
        return "所有网页"

      default: {
        return "所有网页"
      }
    }
  }

  const getDisplayIcon = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return <IconArchive />
      case SearchTarget.CurrentPage:
        return <IconOriginalSize />
      case SearchTarget.All:
        return <IconCommon />
    }
  }

  useEffect(() => {
    searchStateStore.setSearchTarget(SearchTarget.All)
  }, [])

  return (
    <IconTip text="选择网页问答">
      <Dropdown
        droplist={searchTargetDropList}
        trigger="hover"
        position="bottom">
        <Button
          icon={getDisplayIcon(searchStateStore.searchTarget)}
          type="text"
          shape="round">
          {getDisplayText(searchStateStore.searchTarget)}
        </Button>
      </Dropdown>
    </IconTip>
  )
}
