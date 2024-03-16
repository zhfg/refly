import { Button, Input, Space, Alert } from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconUpload,
  IconSend,
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
// stores
import { useQuickActionStore } from "../../stores/quick-action"
import { useChatStore } from "../../stores/chat"
import { useMessageStateStore } from "~stores/message-state"
import { useSiderStore } from "~stores/sider"
import { useWeblinkStore } from "~stores/weblink"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
// hooks
import { useBuildTask } from "~hooks/use-build-task"
import { useBuildThreadAndRun } from "~hooks/use-build-thread-and-run"
import { useStoreWeblink } from "~hooks/use-store-weblink"
// 组件
import { IconTip } from "./icon-tip"
import { SearchTargetSelector } from "./home-search-target-selector"
import type { WebLinkItem } from "~components/weblink-list/types"
import { mapSourceFromWeblinkList } from "~utils/weblink"

const TextArea = Input.TextArea

type ChatProps = {}

// 用于快速选择
export const quickActionList = ["summary"]

const Home = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>()
  const weblinkListRef = useRef(null)

  const quickActionStore = useQuickActionStore()
  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  const { searchTarget } = useSearchStateStore()

  // hooks
  const { runChatTask, runQuickActionTask } = useBuildThreadAndRun()
  const { isWebLinkIndexed, uploadingStatus, handleUploadWebsite } =
    useStoreWeblink()

  const { buildShutdownTaskAndGenResponse } = useBuildTask()
  const isIntentActive = !!quickActionStore.selectedText
  console.log("selectedText", quickActionStore.selectedText)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
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
            placeholder="基于网页进行提问任何内容..."
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 4, maxRows: 4 }}
            style={{
              borderRadius: 8,
              resize: "none",
              minHeight: 98,
              height: 98,
            }}></TextArea>
          <div>
            <div className="toolbar">
              <Space>
                {/* <Button
                  onClick={() => {
                    handleCreateNewConversation()
                  }}
                  icon={<IconPlus />}
                  type="text"
                  shape="round">
                  新会话
                </Button> */}

                <IconTip text="处理当前网页用于问答">
                  <Button
                    onClick={async () => {
                      // 如果是当前网页的快捷操作，那么先上传 Website
                      // TODO: 这里后续需要处理去重
                      if (searchTarget === SearchTarget.CurrentPage) {
                        await handleUploadWebsite(window.location.href)
                      }

                      // 对当前网页进行快速操作
                      runQuickActionTask({
                        filter: {
                          weblinkList: [
                            {
                              pageContent: "",
                              metadata: {
                                title: document?.title || "",
                                source: location.href,
                              },
                              score: -1,
                            } as Source,
                          ],
                        },
                      })
                    }}
                    icon={<IconUpload />}
                    loading={uploadingStatus === "loading" ? true : false}
                    type="text"
                    style={{ marginRight: 0 }}
                    shape="round">
                    {uploadingStatus === "loading" ? "阅读中" : "阅读"}
                  </Button>
                </IconTip>

                <SearchTargetSelector showText />
              </Space>
              <Button
                shape="circle"
                icon={<IconSend />}
                style={{ color: "#FFF", background: "#00968F" }}
                onClick={runChatTask}></Button>
            </div>
          </div>
        </div>
        {webLinkStore?.selectedRow?.length > 0 ? (
          <SelectedWeblink
            closable={true}
            selectedWeblinkList={mapSourceFromWeblinkList(
              webLinkStore.selectedRow || [],
            )}
          />
        ) : null}
        {webLinkStore?.selectedRow?.length > 0 ? <QuickAction /> : null}
      </div>

      <WeblinkList
        ref={weblinkListRef}
        getPopupContainer={() =>
          document
            .querySelector("plasmo-csui")
            ?.shadowRoot?.querySelector(".main")
        }
      />
    </div>
  )
}

export default Home
