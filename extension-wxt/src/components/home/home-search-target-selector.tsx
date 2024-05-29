import { Button, Dropdown, Menu } from "@arco-design/web-react";
import {
  IconOriginalSize,
  IconArchive,
  IconCommon,
  IconCompass,
} from "@arco-design/web-react/icon";

import { useSearchStateStore, SearchTarget } from "@/src/stores/search-state";
import { useWeblinkStore } from "@/src/stores/weblink";
import { IconTip } from "./icon-tip";
import { getPopupContainer } from "@/src/utils/ui";
import { useTranslation } from "react-i18next";

interface SearchTargetSelectorProps {
  showText: boolean;
  handleChangeSelector: (selector: SearchTarget) => void;
}

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
export const SearchTargetSelector = (props: SearchTargetSelectorProps) => {
  const searchStateStore = useSearchStateStore();
  const webLinkStore = useWeblinkStore();

  const { t } = useTranslation();

  const iconStyle = {
    marginRight: 8,
    fontSize: 16,
    transform: "translateY(1px)",
  };
  const searchTargetDropList = (
    <Menu
      className="search-target-selector"
      onClickMenuItem={(key) => {
        console.log("trigger menu", key);
        searchStateStore.setSearchTarget(key as SearchTarget);

        // 如果不是选择历史页面，那么情况选择的 Row
        if (key !== SearchTarget.SelectedPages) {
          webLinkStore.updateSelectedRow([]);
        }

        /**
         * 这里是 thread selector，只要求更换 selector，不要求清空 selectedRow
         */
        props.handleChangeSelector(key as SearchTarget);
      }}
    >
      <Menu.Item key={SearchTarget.CurrentPage}>
        <IconOriginalSize style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.current")}
      </Menu.Item>
      <Menu.Item
        key={SearchTarget.SelectedPages}
        onClick={() => {
          webLinkStore.updateIsWebLinkListVisible(true);
        }}
      >
        <IconArchive style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.history")}
      </Menu.Item>
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.all")}
      </Menu.Item>
      <Menu.Item key={SearchTarget.SearchEnhance}>
        <IconCompass style={iconStyle} />
        {t("loggedHomePage.homePage.searchScope.internet")}
      </Menu.Item>
    </Menu>
  );

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return t("loggedHomePage.homePage.searchScope.history");
      case SearchTarget.CurrentPage:
        return t("loggedHomePage.homePage.searchScope.current");
      case SearchTarget.SearchEnhance:
        return t("loggedHomePage.homePage.searchScope.internet");
      case SearchTarget.All:
        return t("loggedHomePage.homePage.searchScope.all");
    }
  };

  const getDisplayIcon = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return <IconArchive />;
      case SearchTarget.CurrentPage:
        return <IconOriginalSize />;
      case SearchTarget.SearchEnhance:
        return <IconCompass />;
      case SearchTarget.All:
        return <IconCommon />;
    }
  };

  return (
    <IconTip text={t("loggedHomePage.homePage.searchScope.title")}>
      <Dropdown
        droplist={searchTargetDropList}
        trigger="hover"
        position="bottom"
        getPopupContainer={getPopupContainer}
      >
        <Button
          icon={getDisplayIcon(searchStateStore.searchTarget)}
          type="text"
          style={
            props.showText ? {} : { width: 42, height: 32, borderRadius: 16 }
          }
          shape={props.showText ? "round" : "circle"}
        >
          {props.showText
            ? getDisplayText(searchStateStore.searchTarget)
            : null}
        </Button>
      </Dropdown>
    </IconTip>
  );
};
