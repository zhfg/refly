import {
  Button,
  Input,
  Space,
  Alert,
  Message as message,
  Divider,
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconUpload,
  IconSend,
  IconScissor,
  IconHighlight,
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef } from "react"

import { TASK_TYPE, type Source } from "~/types"

// 自定义方法
import { scrollToBottom } from "~utils/ui"

// 自定义组件
import WeblinkList from "../weblink-list"
import { ChatHeader } from "./header"
import { SelectedWeblink } from "../selected-weblink/index"
import { QuickAction } from "./quick-action"
import { ContentSelectorBtn } from "~components/content-selector-btn/index"
// stores
import { useQuickActionStore } from "../../stores/quick-action"
import { useChatStore } from "../../stores/chat"
import { useMessageStateStore } from "~stores/message-state"
import { useSiderStore } from "~stores/sider"
import { useWeblinkStore } from "~stores/weblink"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
import { useContentSelectorStore } from "~stores/content-selector"
// hooks
import { useBuildTask } from "~hooks/use-build-task"
import { useBuildThreadAndRun } from "~hooks/use-build-thread-and-run"
import { useStoreWeblink } from "~hooks/use-store-weblink"
import { useSelectedMark } from "~hooks/use-selected-mark"
// 组件
import { IconTip } from "./icon-tip"
import { SearchTargetSelector } from "./home-search-target-selector"
import type { WebLinkItem } from "~components/weblink-list/types"
import { mapSourceFromWeblinkList } from "~utils/weblink"
import { sendToBackground } from "@plasmohq/messaging"
import { SelectedContentList } from "~components/selected-content-list"
import { useSearchQuickActionStore } from "~stores/search-quick-action"

const TextArea = Input.TextArea

type ChatProps = {}

// 用于快速选择
export const quickActionList = ["summary"]

const Home = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>()
  const weblinkListRef = useRef(null)

  // stores
  const quickActionStore = useQuickActionStore()
  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  const { searchTarget } = useSearchStateStore()
  const contentSelectorStore = useContentSelectorStore()
  const searchQuickActionStore = useSearchQuickActionStore()
  const searchStateStore = useSearchStateStore()

  // hooks
  const { runTask } = useBuildThreadAndRun()
  const { isWebLinkIndexed } = useStoreWeblink()

  const { buildShutdownTaskAndGenResponse } = useBuildTask()
  const isIntentActive = !!quickActionStore.selectedText

  const handleSendMessage = () => {
    const { newQAText } = useChatStore.getState()

    if (!newQAText) {
      message.info("提问内容不能为空")
      return
    }

    runTask()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    if (e.keyCode === 13) {
      handleSendMessage()
    }
  }

  const getInputText = () => {
    const { showSelectedMarks } = useContentSelectorStore.getState()
    const { searchTarget } = useSearchStateStore.getState()

    if (showSelectedMarks) return "基于实时选择内容提问..."
    if (searchTarget === SearchTarget.SelectedPages)
      return "对选中的网页进行提问..."
    if (searchTarget === SearchTarget.CurrentPage)
      return "对当前网页进行提问..."
    if (searchTarget === SearchTarget.SearchEnhance)
      return "输入关键词进行网络搜索..."
    if (searchTarget === SearchTarget.All) return "对历史所有网页进行提问..."
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])
  // 如果有展示意图，那么也需要滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [isIntentActive])

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <ChatHeader />
      <div className="footer input-panel">
        {isWebLinkIndexed ? (
          <Alert
            type="success"
            content="此网页已经被索引，可以直接提问！"
            closable
          />
        ) : (
          <Alert
            type="warning"
            content="此网页未索引，点击下方「阅读」可索引！"
            closable
          />
        )}
        <div className="refly-slogan">The answer engine for your work</div>
        <div className="actions">
          {messageStateStore.taskType === TASK_TYPE.CHAT &&
            messageStateStore?.pending && (
              <div className="stop-reponse">
                <Button
                  type="outline"
                  className="btn"
                  icon={<IconMinusCircle />}
                  onClick={buildShutdownTaskAndGenResponse}>
                  停止响应
                </Button>
              </div>
            )}
        </div>

        <div className="input-box">
          <TextArea
            ref={inputRef}
            className="message-input"
            autoFocus
            value={chatStore?.newQAText}
            onChange={(value) => {
              chatStore.setNewQAText(value)
            }}
            placeholder={getInputText()}
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 4, maxRows: 4 }}
            onCompositionStart={(e) => console.log("composition start")}
            onCompositionUpdate={(e) => console.log("composition update")}
            onCompositionEnd={(e) => console.log("composition end")}
            style={{
              borderRadius: 8,
              resize: "none",
              minHeight: 98,
              height: 98,
            }}></TextArea>
          <div>
            <div className="toolbar">
              <Space>
                <ContentSelectorBtn
                  handleChangeSelector={() => {
                    // 如果进行选中之后，则切换成选择当前网页，属于一种快捷方式
                    searchStateStore.setSearchTarget(SearchTarget.CurrentPage)
                  }}
                />
                <SearchTargetSelector
                  showText
                  handleChangeSelector={(searchTarget) => {
                    // 非当前网页时，则清空内容
                    if (searchTarget !== SearchTarget.CurrentPage) {
                      contentSelectorStore.resetState()
                    }

                    if (
                      [SearchTarget.All, SearchTarget.SearchEnhance].includes(
                        searchTarget,
                      )
                    ) {
                      searchQuickActionStore.setShowQuickAction(false)
                    }
                  }}
                />
              </Space>
              <Button
                shape="circle"
                icon={<IconSend />}
                style={{ color: "#FFF", background: "#00968F" }}
                onClick={() => handleSendMessage()}></Button>
            </div>
          </div>
        </div>
        {webLinkStore?.selectedRow?.length > 0
          ? [
              <SelectedWeblink
                closable={true}
                selectedWeblinkList={mapSourceFromWeblinkList(
                  webLinkStore.selectedRow || [],
                )}
              />,
              <Divider />,
            ]
          : null}
        {searchQuickActionStore.showQuickAction ? <QuickAction /> : null}
        {contentSelectorStore?.showSelectedMarks ? (
          <SelectedContentList marks={contentSelectorStore.marks} />
        ) : null}
      </div>

      <WeblinkList
        ref={weblinkListRef}
        getPopupContainer={() => {
          const elem = document
            .querySelector("#refly-main-app")
            ?.shadowRoot?.querySelector(".main")

          return elem as HTMLElement
        }}
      />
    </div>
  )
}

export default Home
