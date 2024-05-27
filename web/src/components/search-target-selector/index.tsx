import { Button, Dropdown, Menu, Typography } from "@arco-design/web-react"
import {
  IconCommon,
  IconCompass,
  IconFile,
  IconDriveFile,
  IconFolder,
  IconBook,
  IconCaretDown,
} from "@arco-design/web-react/icon"

import { useSearchStateStore, SearchTarget } from "@/stores/search-state"
import { useWeblinkStore } from "@/stores/weblink"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
// 自定义样式
import "./index.scss"

export const SearchTargetSelector = (props: { classNames: string }) => {
  const searchStateStore = useSearchStateStore()
  const webLinkStore = useWeblinkStore()

  const { t } = useTranslation()

  const iconStyle = {
    marginRight: 8,
    fontSize: 16,
    transform: "translateY(1px)",
  }
  const searchTargetDropList = (
    <Menu
      style={{ width: 200 }}
      className="search-target-selector"
      onClickMenuItem={key => {
        console.log("trigger menu", key)
        searchStateStore.setSearchTarget(key as SearchTarget)

        // 如果不是选择历史页面，那么情况选择的 Row
        if (key !== SearchTarget.SelectedPages) {
          webLinkStore.updateSelectedRow([])
        }
      }}>
      <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
        {t("loggedHomePage.homePage.searchScope.title")}
      </Typography.Text>
      <Menu.Item key={SearchTarget.CurrentPage}>
        <IconFile style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.currentPage")}
      </Menu.Item>
      <Menu.Item key={SearchTarget.CurrentKnowledgeBase}>
        <IconFolder style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.currentKnowledgeBase")}
      </Menu.Item>
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.all")}
      </Menu.Item>
      {/* <Menu.Item
        key={SearchTarget.SelectedPages}
        onClick={() => {
          webLinkStore.updateIsWebLinkListVisible(true)
        }}>
        <IconBook style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.history")}
      </Menu.Item> */}
      <Menu.Item key={SearchTarget.SearchEnhance}>
        <IconCompass style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.internet")}
      </Menu.Item>
      {/* <Menu.Item key={SearchTarget.None}>
        <IconDriveFile style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.none")}
      </Menu.Item> */}
    </Menu>
  )

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.CurrentPage:
        return t("loggedHomePage.homePage.searchScope.currentPage")
      case SearchTarget.CurrentKnowledgeBase:
        return t("loggedHomePage.homePage.searchScope.currentKnowledgeBase")

      case SearchTarget.SelectedPages:
        return t("loggedHomePage.homePage.searchScope.history")
      case SearchTarget.All:
        return t("loggedHomePage.homePage.searchScope.all")
      case SearchTarget.SearchEnhance:
        return t("loggedHomePage.homePage.searchScope.internet")
      case SearchTarget.None:
        return t("loggedHomePage.homePage.searchScope.none")

      default: {
        return t("loggedHomePage.homePage.searchScope.all")
      }
    }
  }

  const getDisplayIcon = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.CurrentPage:
        return <IconFile />
      case SearchTarget.CurrentKnowledgeBase:
        return <IconFolder />
      case SearchTarget.SelectedPages:
        return <IconBook />
      case SearchTarget.SearchEnhance:
        return <IconCompass />
      case SearchTarget.None:
        return <IconDriveFile />
      case SearchTarget.All:
        return <IconCommon />
    }
  }

  // useEffect(() => {
  //   searchStateStore.setSearchTarget(SearchTarget.All)
  // }, [])

  return (
    <Dropdown droplist={searchTargetDropList} trigger="hover" position="bottom">
      <Button
        icon={getDisplayIcon(searchStateStore.searchTarget)}
        type="text"
        className={props.classNames}
        shape="round">
        <span>{getDisplayText(searchStateStore.searchTarget)}</span>
        <IconCaretDown />
      </Button>
    </Dropdown>
  )
}
