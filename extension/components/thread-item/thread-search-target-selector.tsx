import { Button, Dropdown, Menu } from "@arco-design/web-react"
import {
  IconOriginalSize,
  IconArchive,
  IconCommon,
  IconCompass,
} from "@arco-design/web-react/icon"
import { IconTip } from "~components/home/icon-tip"

import { SearchTarget } from "~stores/search-state"
import { useWeblinkStore } from "~stores/weblink"
import { getPopupContainer } from "~utils/ui"

/**
 * 这里的产品思考：
 * 1. 产品逻辑要打平，不要太复杂
 * 2. 如果用户是选了某个网页或者某几个网页开始提问，那么逻辑应该是这样
 *  2.1 默认是基于选中的网页做持续追问，逻辑是跟随的
 *  2.2 用户可以切换选择所有内容
 *  2.3 No：用户不能再选择切换选中其他网页？
 *  2.4 推迟实现，先简单点 follow 规则和所有网页：用户可以选择基于已有选择、选中新的一组或选择所有内容，这样的好处就是能够倒逼优化多轮效果，做出竞争力，允许用户将多个
 *
 */
interface ThreadSearchTargetSelectorProps {
  searchTarget: SearchTarget
  showText: boolean
  handleChangeSelector: (selector: SearchTarget) => void
}

export const ThreadSearchTargetSelector = (
  props: ThreadSearchTargetSelectorProps,
) => {
  const iconStyle = {
    marginRight: 8,
    fontSize: 16,
    transform: "translateY(1px)",
  }
  const searchTargetDropList = (
    <Menu
      className="search-target-selector"
      onClickMenuItem={(key) => {
        console.log("trigger menu", key)
        /**
         * 这里是 thread selector，只要求更换 selector，不要求清空 selectedRow
         */
        props.handleChangeSelector(key as SearchTarget)
      }}>
      <Menu.Item key={SearchTarget.CurrentPage}>
        <IconOriginalSize style={iconStyle} />
        当前网页
      </Menu.Item>
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        所有网页
      </Menu.Item>
      <Menu.Item key={SearchTarget.SelectedPages}>
        <IconArchive style={iconStyle} />
        选中网页
      </Menu.Item>
      <Menu.Item key={SearchTarget.SearchEnhance}>
        <IconCompass style={iconStyle} />
        联网搜索
      </Menu.Item>
    </Menu>
  )

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return "选中网页"
      case SearchTarget.All:
        return "所有网页"
      case SearchTarget.CurrentPage:
        return "当前网页"
      case SearchTarget.SearchEnhance:
        return "联网搜索"
    }
  }

  const getDisplayIcon = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return <IconArchive />
      case SearchTarget.CurrentPage:
        return <IconOriginalSize />
      case SearchTarget.SearchEnhance:
        return <IconCompass />
      case SearchTarget.All:
        return <IconCommon />
    }
  }

  return (
    <IconTip text={getDisplayText(props.searchTarget) || "选择搜索模式"}>
      <Dropdown
        droplist={searchTargetDropList}
        trigger="hover"
        position="bottom"
        getPopupContainer={getPopupContainer}>
        <Button
          className={"thread-search-target-selector"}
          icon={getDisplayIcon(props.searchTarget)}
          type="text"
          style={
            props.showText ? {} : { width: 45, height: 32, borderRadius: 16 }
          }
          shape={props.showText ? "round" : "circle"}>
          {props.showText ? getDisplayText(props.searchTarget) : null}
        </Button>
      </Dropdown>
    </IconTip>
  )
}
