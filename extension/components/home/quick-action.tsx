import { Button, Message as message } from "@arco-design/web-react"
import { IconScissor, IconStar } from "@arco-design/web-react/icon"
import { IconTip } from "./icon-tip"
import { useWeblinkStore } from "~stores/weblink"
import { mapSourceFromWeblinkList } from "~utils/weblink"
import { useBuildThreadAndRun } from "~hooks/use-build-thread-and-run"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
import { useSearchQuickActionStore } from "~stores/search-quick-action"
import { useContentSelectorStore } from "~stores/content-selector"
import { useStoreWeblink } from "~hooks/use-store-weblink"
import type { Source } from "~types"
import { useTranslation } from "react-i18next"
import { useChatStore } from "~stores/chat"

export const QuickAction = () => {
  // stores
  const chatStore = useChatStore()
  const contentSelectorStore = useContentSelectorStore()
  const { uploadingStatus, handleUploadWebsite } = useStoreWeblink()
  const { searchTarget } = useSearchStateStore()
  const { showSelectedMarks, marks = [] } = useContentSelectorStore()

  const { t } = useTranslation()

  // hooks
  const { runQuickActionTask } = useBuildThreadAndRun()

  const getText = (slot: string) => {
    const { selectedRow } = useWeblinkStore.getState()
    const { showSelectedMarks } = useContentSelectorStore.getState()

    if (showSelectedMarks)
      return t(
        "translation:loggedHomePage.homePage.recommendQuickAction.summary.tip.currentSelectedContent",
        "",
        { action: slot },
      )
    if (selectedRow?.length > 0)
      return t(
        "translation:loggedHomePage.homePage.recommendQuickAction.summary.tip.selectedWeblink",
        "",
        { action: slot },
      )
    if (selectedRow?.length === 0)
      return t(
        "translation:loggedHomePage.homePage.recommendQuickAction.summary.tip.current",
        "",
        { action: slot },
      )
  }

  /**
   * 1. quickAction 单个网页或多个网页都统一应用规则
   * 2. 也只有这两种情况下需要
   */
  const handleSummary = async () => {
    chatStore.setLoading(true)

    console.log("handleSummary")
    if (uploadingStatus === "loading") return

    const { searchTarget } = useSearchStateStore.getState()
    const { marks } = useContentSelectorStore.getState()

    let filter = {}

    // TODO: 增加 xPath
    if (searchTarget === SearchTarget.CurrentPage) {
      // 1）单个网页的时候 2）单个网页中部分内容，都需要先上传
      // 然后服务端只取 html + xpath 做处理，以及下次重新访问会话时展示 filter 也是用 html + xpath 获取内容展示
      message.loading(
        t(
          "translation:loggedHomePage.homePage.recommendQuickAction.summary.status.contentHandling",
        ),
      )
      const res = await handleUploadWebsite(window.location.href)

      if (res.success) {
        message.success(
          t(
            "translation:loggedHomePage.homePage.recommendQuickAction.summary.status.contentHandleSuccessNotify",
          ),
        )
      } else {
        message.error(
          t(
            "translation:loggedHomePage.homePage.recommendQuickAction.summary.status.contentHandleFailedNotify",
          ),
        )
      }

      filter = {
        weblinkList: [
          {
            pageContent: "",
            metadata: {
              title: document?.title || "",
              source: location.href,
            },
            score: -1,
            selections: marks?.map((item) => ({
              type: "text",
              xPath: item?.xPath,
              content: item?.data,
            })),
          } as Source,
        ],
      }
    } else if (searchTarget === SearchTarget.SelectedPages) {
      const { selectedRow } = useWeblinkStore.getState()
      const weblinkList = mapSourceFromWeblinkList(selectedRow)
      filter = {
        weblinkList,
      }
    }

    runQuickActionTask({
      filter,
    })
  }

  const handleQuickActionTranslate = () => {}

  const handleQuickActionExplain = () => {}

  const handleStoreForLater = async () => {
    message.loading(
      t(
        "translation:loggedHomePage.homePage.recommendQuickAction.save.status.contentHandling",
      ),
    )
    const res = await handleUploadWebsite(window.location.href)

    if (res.success) {
      message.success(
        t(
          "translation:loggedHomePage.homePage.recommendQuickAction.save.status.contentHandleSuccessNotify",
        ),
      )
    } else {
      message.error(
        t(
          "translation:loggedHomePage.homePage.recommendQuickAction.save.status.contentHandleFailedNotify",
        ),
      )
    }
  }

  const handleActiveContentSelector = () => {
    contentSelectorStore.setShowContentSelector(true)
  }

  const showSummary = [
    SearchTarget.CurrentPage,
    SearchTarget.SelectedPages,
  ].includes(searchTarget)

  const showTranslateOrExplain =
    searchTarget === SearchTarget.CurrentPage &&
    showSelectedMarks &&
    marks.length > 0

  return (
    <>
      <div className="selected-weblinks-container">
        <div className="selected-weblinks-inner-container">
          <div className="hint-item">
            <IconStar style={{ color: "rgba(0, 0, 0, .6)" }} />
            <span>
              {t(
                "translation:loggedHomePage.homePage.recommendQuickAction.title",
              )}
            </span>
          </div>
          {/* 理论上针对单个网页、多个网页都可以进行总结 */}
          {showSummary ? (
            <IconTip
              text={getText(
                t(
                  "translation:loggedHomePage.homePage.recommendQuickAction.summary.tip.title",
                ),
              )}>
              <Button
                onClick={() => handleSummary()}
                style={{ fontSize: 12 }}
                shape="round"
                size="small">
                {t(
                  "translation:loggedHomePage.homePage.recommendQuickAction.summary.title",
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
            text={t(
              "translation:loggedHomePage.homePage.recommendQuickAction.save.tip",
            )}>
            <Button
              onClick={() => handleStoreForLater()}
              style={{ fontSize: 12 }}
              shape="round"
              size="small">
              {t(
                "translation:loggedHomePage.homePage.recommendQuickAction.save.title",
              )}
            </Button>
          </IconTip>
        </div>
      </div>
    </>
  )
}
