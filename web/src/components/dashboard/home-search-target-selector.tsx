import { Button, Dropdown, Menu, Typography } from "@arco-design/web-react"
import {
  IconOriginalSize,
  IconArchive,
  IconCommon,
  IconCompass,
} from "@arco-design/web-react/icon"

import { useSearchStateStore, SearchTarget } from "@/stores/search-state"
import { useWeblinkStore } from "@/stores/weblink"
import { IconTip } from "./icon-tip"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export const SearchTargetSelector = () => {
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
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.all")}
      </Menu.Item>
      <Menu.Item
        key={SearchTarget.SelectedPages}
        onClick={() => {
          webLinkStore.updateIsWebLinkListVisible(true)
        }}>
        <IconArchive style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.history")}
      </Menu.Item>
      <Menu.Item key={SearchTarget.SearchEnhance}>
        <IconCompass style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.internet")}
      </Menu.Item>
    </Menu>
  )

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return t("loggedHomePage.homePage.searchScope.history")
      case SearchTarget.All:
        return t("loggedHomePage.homePage.searchScope.all")
      case SearchTarget.SearchEnhance:
        return t("loggedHomePage.homePage.searchScope.internet")

      default: {
        return t("loggedHomePage.homePage.searchScope.all")
      }
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

  useEffect(() => {
    searchStateStore.setSearchTarget(SearchTarget.All)
  }, [])

  return (
    <Dropdown droplist={searchTargetDropList} trigger="hover" position="bottom">
      <Button
        icon={getDisplayIcon(searchStateStore.searchTarget)}
        type="text"
        shape="round">
        {getDisplayText(searchStateStore.searchTarget)}
      </Button>
    </Dropdown>
  )
}
