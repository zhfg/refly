import {
  Button,
  Input,
  Message as message,
  Space,
  Alert,
  Tag,
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconUpload,
  IconSend,
  IconRightCircle,
  IconLink,
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { useNavigate } from "react-router-dom"

import {
  MessageItemType,
  TASK_TYPE,
  type Message,
  type Task,
  QUICK_ACTION_TYPE,
  type QUICK_ACTION_TASK_PAYLOAD,
  LANGUAGE,
  LOCALE,
  type Source,
} from "~/types"

// 自定义方法
import { scrollToBottom } from "~utils/ui"

// 自定义组件
import WeblinkList from "../weblink-list"
import {
  ErrorMessage,
  IntentMessage,
  QuestionMessage,
  ReplyMessage,
} from "./message-list"
import { ChatHeader } from "./header"
import { SelectedWeblink } from "../selected-weblink/index"
// utils
import { getLoadingStatusText } from "./utils"
import { buildConversation } from "~utils/conversation"
// stores
import { useQuickActionStore } from "../../stores/quick-action"
import { useChatStore } from "../../stores/chat"
import { useConversationStore } from "~stores/conversation"
import { useMessageStateStore } from "~stores/message-state"
import { useSiderStore } from "~stores/sider"
import { useWeblinkStore } from "~stores/weblink"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
// hooks
import { useBuildTask } from "~hooks/use-build-task"
import { useResetState } from "~hooks/use-reset-state"
import { useWebLinkIndexed } from "~hooks/use-weblink-indexed"
import type { PlasmoGetStyle } from "plasmo"
import { IconTip } from "./icon-tip"
// 组件
import { SearchTargetSelector } from "./home-search-target-selector"
import { useTaskStore } from "~stores/task"
import { buildChatTask, buildQuickActionTask } from "~utils/task"
import type { WebLinkItem } from "~components/weblink-list/types"

const TextArea = Input.TextArea

type ChatProps = {}

// 用于快速选择
export const quickActionList = ["summary"]

const Home = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>()
  const weblinkListRef = useRef(null)
  const [uploadingStatus, setUploadingStatus] = useState<
    "normal" | "loading" | "failed" | "success"
  >("normal")
  const navigate = useNavigate()

  // 网页索引状态
  const { isWebLinkIndexed, setIsWebLinkIndexed } = useWebLinkIndexed()

  const quickActionStore = useQuickActionStore()
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const messageStateStore = useMessageStateStore()
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  const taskStore = useTaskStore()
  // hooks
  const { resetState } = useResetState()

  const { buildShutdownTaskAndGenResponse } = useBuildTask()
  const isIntentActive = !!quickActionStore.selectedText
  console.log("selectedText", quickActionStore.selectedText)

  const renderMessage = (type: MessageItemType, message: Message) => {
    switch (type) {
      // case MessageType.Example:
      //   return ExampleQuestionItem(message)
      case MessageItemType.REPLY:
        return ReplyMessage(message)
      case MessageItemType.QUESTION:
        return QuestionMessage(message)
      case MessageItemType.INTENT:
        return IntentMessage(message)
      case MessageItemType.ERROR:
        return ErrorMessage(message)
    }
  }

  /**
   * 1. 以下几种情况会新建会话 Id：
   *      1. 打开一个新的 quickAction
   *      2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   * 2. 直到第一次调用 /generate/gen 接口生成响应的时候，才将会话 id 传给服务端保存一个会话
   */
  // 页面状态和 conversationId 是同步的
  /**
   * 以下几种情况会新建会话 Id：
   * 1. 打开一个新的 quickAction
   * 2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   *
   * 页面状态和会话 Id 是绑定的：
   * - messages
   * - messageState
   * - selectedText
   * - popupVisible
   * - newQAText
   * - currentMode
   */
  const handleCreateNewConversation = async (task: Task) => {
    /**
     * 1. 创建新 thread，设置状态
     * 2. 跳转到 thread 界面，进行第一个回复，展示 问题、sources、答案
     */
    const question = chatStore.newQAText
    const newConversationPayload = buildConversation()

    // 创建新会话
    const res = await sendToBackground({
      name: "createNewConversation",
      body: newConversationPayload,
    })

    if (!res?.success) {
      message.error({
        content: "创建新会话失败！",
      })
      return
    }

    console.log("createNewConversation", res)
    conversationStore.setCurrentConversation(res?.data)

    // 清空之前的状态
    resetState()

    // 设置当前的任务类型及会话 id
    task.data = {
      ...(task?.data || {}),
      conversationId: res?.data?.id,
    }
    taskStore.setTask(task)

    // 更新新的 newQAText，for 新会话跳转使用
    chatStore.setNewQAText(question)
    chatStore.setIsNewConversation(true)
    navigate(`/thread/${res?.data?.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  const handleUploadWebsite = async (url: string) => {
    // setIsUpdatingWebiste(true)
    setUploadingStatus("loading")

    const description = document.head.querySelector('meta[name="description"]')

    const res = await sendToBackground({
      name: "storeWeblink",
      body: {
        url,
        origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: document?.title || "",
        originPageUrl: location.href,
        originPageDescription: (description as any)?.content || "",
      },
    })

    if (res.success) {
      message.success("阅读成功！")
      setIsWebLinkIndexed(true)
    } else {
      message.error("阅读失败！")
    }

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)
  }

  // TODO: 这里需要新增一个方法用于处理 quickAction

  const runChatTask = () => {
    const question = chatStore.newQAText
    const { selectedRow } = useWeblinkStore.getState()
    const { searchTarget } = useSearchStateStore.getState()

    let selectedWebLink: Source[] = []

    if (searchTarget === SearchTarget.CurrentPage) {
      selectedWebLink = [
        {
          pageContent: "",
          metadata: {
            title: document?.title || "",
            source: location.href,
          },
          score: -1, // 手工构造
        },
      ]
    } else if (searchTarget === SearchTarget.SelectedPages) {
      selectedWebLink = selectedRow?.map((item) => ({
        pageContent: "",
        metadata: {
          title: item?.content?.originPageTitle,
          source: item?.content?.originPageUrl,
        },
        score: -1, // 手工构造
      }))
    }

    const task = buildChatTask({
      question,
      filter: { weblinkList: selectedWebLink },
    })

    // 创建新会话并跳转
    handleCreateNewConversation(task)
  }

  const runQuickActionTask = async (
    payload: QUICK_ACTION_TASK_PAYLOAD,
    searchTarget: SearchTarget = SearchTarget.CurrentPage,
  ) => {
    // 如果是当前网页的快捷操作，那么先上传 Website
    // TODO: 这里后续需要处理去重
    if (searchTarget === SearchTarget.CurrentPage) {
      await handleUploadWebsite(window.location.href)
    }

    const task = buildQuickActionTask({
      question: `总结网页`,
      actionType: QUICK_ACTION_TYPE.SUMMARY,
      filter: payload?.filter,
      actionPrompt: "总结网页内容并提炼要点",
    })

    // 创建新会话并跳转
    handleCreateNewConversation(task)
  }

  const mapSourceFromSelectedRow = (
    selectedRow: { content: WebLinkItem; key: string | number }[],
  ) => {
    return selectedRow?.map((item) => ({
      pageContent: item?.content?.originPageDescription,
      metadata: {
        source: item?.content?.originPageUrl,
        title: item?.content?.originPageTitle,
      },
      score: -1,
    }))
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
      {/* <div
        className="chat-wrapper"
        style={{ paddingBottom: isIntentActive ? 72 : 52 }}>
        <div className="chat chat-light">
          <div className="chat-box">
            <div className="wrapper">
              <div className="chat-container">
                {messages.map((msg, idx) => (
                  <div className={msg?.itemType + "-message"} key={idx}>
                    {renderMessage(msg?.itemType, msg)}
                  </div>
                ))}
                {messageState.taskType === TASK_TYPE.CHAT &&
                  messageState?.pendingFirstToken && (
                    <div className={"loading-message"}>{LoadingMessage()}</div>
                  )}
                {isIntentActive && (
                  <DynamicIntentMsgList
                    intentText={selectedText}
                    setSelectedText={setSelectedText}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div> */}

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
          {/* {isIntentActive && (
            <div className="intent">
              <div className="action-bar">
                <div className="action-box">
                  {modeList.map((modeItem, index) => (
                    <Button
                      key={index}
                      size="mini"
                      type="outline"
                      className="action-btn"
                      onClick={() =>
                        buildIntentQuickActionTaskAndGenReponse(
                          modeItem?.prompt
                        )
                      }>
                      {modeItem.text}
                    </Button>
                  ))}
                </div>
                <div className="action-popover"></div>
              </div>
            </div>
          )} */}
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
                    onClick={() => {
                      // 对当前网页进行快速操作
                      runQuickActionTask(
                        {
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
                        },
                        SearchTarget.CurrentPage,
                      )
                    }}
                    icon={<IconUpload />}
                    loading={uploadingStatus === "loading" ? true : false}
                    type="text"
                    style={{ marginRight: 0 }}
                    shape="round">
                    {uploadingStatus === "loading" ? "阅读中" : "阅读"}
                  </Button>
                </IconTip>

                {/** 第一版本不支持选择指定网页进行问答 */}
                <SearchTargetSelector showText />
                {/* <Button
              onClick={() => {
                conversationListInstanceRef?.current?.setVisible(true)
              }}
              size="mini"
              icon={<IconClockCircle />}
              status="success"
              shape="round">
              历史记录
            </Button> */}
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
            selectedWeblinkList={mapSourceFromSelectedRow(
              webLinkStore.selectedRow || [],
            )}
          />
        ) : null}
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
