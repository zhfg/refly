import { Button, Message as message } from "@arco-design/web-react";
import { IconStar } from "@arco-design/web-react/icon";
import { IconTip } from "./icon-tip";
import { useWeblinkStore } from "@/stores/weblink";
import { useBuildThreadAndRun } from "@/hooks/use-build-thread-and-run";
import { SearchTarget, useSearchStateStore } from "@/stores/search-state";
import { useContentSelectorStore } from "@/stores/content-selector";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chat";
import { useQuickActionHandler } from "@/hooks/use-quick-action-handler";

export const QuickAction = () => {
  // stores
  const chatStore = useChatStore();
  const contentSelectorStore = useContentSelectorStore();
  const { searchTarget } = useSearchStateStore();
  const { showSelectedMarks, marks = [] } = useContentSelectorStore();

  const { summarize, storeForLater } = useQuickActionHandler();
  const { t } = useTranslation();

  const getText = (slot: string) => {
    const { selectedRow } = useWeblinkStore.getState();
    const { showSelectedMarks } = useContentSelectorStore.getState();

    if (showSelectedMarks)
      return t(
        "loggedHomePage.homePage.recommendQuickAction.summary.tip.currentSelectedContent",
        "",
        { action: slot }
      );
    if (selectedRow?.length > 0)
      return t(
        "loggedHomePage.homePage.recommendQuickAction.summary.tip.selectedWeblink",
        "",
        { action: slot }
      );
    if (selectedRow?.length === 0)
      return t(
        "loggedHomePage.homePage.recommendQuickAction.summary.tip.current",
        "",
        { action: slot }
      );
  };

  const handleActiveContentSelector = () => {
    contentSelectorStore.setShowContentSelector(true);
  };

  const showSummary = [
    SearchTarget.CurrentPage,
    SearchTarget.SelectedPages,
  ].includes(searchTarget);

  const showTranslateOrExplain =
    searchTarget === SearchTarget.CurrentPage &&
    showSelectedMarks &&
    marks.length > 0;

  return (
    <>
      <div className="selected-weblinks-container">
        <div className="selected-weblinks-inner-container">
          <div className="hint-item">
            <IconStar style={{ color: "rgba(0, 0, 0, .6)" }} />
            <span>
              {t("loggedHomePage.homePage.recommendQuickAction.title")}
            </span>
          </div>
          {/* 理论上针对单个网页、多个网页都可以进行总结 */}
          {showSummary ? (
            <IconTip
              text={getText(
                t(
                  "loggedHomePage.homePage.recommendQuickAction.summary.tip.title"
                )
              )}
            >
              <Button
                onClick={() => summarize()}
                style={{ fontSize: 12 }}
                shape="round"
                size="small"
              >
                {t(
                  "loggedHomePage.homePage.recommendQuickAction.summary.title"
                )}
              </Button>
            </IconTip>
          ) : null}
          {/* 后续快捷操作拓展之后实现 */}
          {/* {showTranslateOrExplain
            ? [
                <IconTip text={getText("翻译")}>
                  <Button
                    onClick={() => handleQuickActionTranslate()}
                    style={{ fontSize: 12 }}
                    shape="round"
                    size="small">
                    翻译
                  </Button>
                </IconTip>,
                <IconTip text={getText("解释")}>
                  <Button
                    onClick={() => handleQuickActionExplain()}
                    style={{ fontSize: 12 }}
                    shape="round"
                    size="small">
                    解释
                  </Button>
                </IconTip>,
              ]
            : null} */}
          <IconTip
            text={t("loggedHomePage.homePage.recommendQuickAction.save.tip")}
          >
            <Button
              onClick={() => storeForLater()}
              style={{ fontSize: 12 }}
              shape="round"
              size="small"
            >
              {t("loggedHomePage.homePage.recommendQuickAction.save.title")}
            </Button>
          </IconTip>
        </div>
      </div>
    </>
  );
};
