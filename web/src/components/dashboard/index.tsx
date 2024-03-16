import {
  Button,
  Input,
  Message as message,
  Space,
  Tag,
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconSend,
  IconRightCircle,
  IconLink,
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"
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
  Thread,
} from "@/types"

// 自定义组件
import WeblinkList from "../weblink-list"
import { SelectedWeblink } from "../selected-weblink/index"
// utils
import { buildConversation } from "@/utils/conversation"
import { buildChatTask, buildQuickActionTask } from "@/utils/task"
// 自定义方法
import { scrollToBottom } from "@/utils/ui"
// stores
import { useChatStore } from "../../stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useMessageStateStore } from "@/stores/message-state"
import { useSiderStore } from "@/stores/sider"
import { useWeblinkStore } from "@/stores/weblink"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { useTaskStore } from "@/stores/task"
// hooks
import { useBuildTask } from "@/hooks/use-build-task"
import { useResetState } from "@/hooks/use-reset-state"
// 组件
import { SearchTargetSelector } from "./home-search-target-selector"
// request
import createNewConversation from "@/requests/createNewConversation"
// scss
import "./index.scss"
import classNames from "classnames"
import { useCookie } from "react-use"
// types
import type { WebLinkItem } from "@/types/weblink"

const TextArea = Input.TextArea

export const extensionId = "fcncfleeddfdpbigljgiejfdkmpkldpe"

// 用于快速选择
export const quickActionList = ["summary"]

const Home = () => {
  const inputRef = useRef<RefTextAreaType>(null)
  const [isFocused, setIsFocused] = useState(false)
  const weblinkListRef = useRef(null)
  const navigate = useNavigate()
  const [token] = useCookie("_refly_ai_sid")

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const messageStateStore = useMessageStateStore()
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  const taskStore = useTaskStore()
  // hooks
  const { resetState } = useResetState()

  const { buildShutdownTaskAndGenResponse } = useBuildTask()

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
    const res = await createNewConversation({
      body: newConversationPayload,
    })

    if (!res?.success) {
      message.error({
        content: "创建新会话失败！",
      })
      return
    }

    console.log("createNewConversation", res)
    conversationStore.setCurrentConversation(res?.data as Thread)

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

  const handleSendMsgToExtension = async (
    status: "success" | "failed",
    token?: string,
  ) => {
    try {
      await chrome.runtime.sendMessage(extensionId, {
        name: "login-notification",
        body: {
          status,
          token,
        },
      })
    } catch (err) {
      console.log("handleSendMsgToExtension err", err)
    }

    console.log("dashboard close")
    window.close()
  }

  const runChatTask = () => {
    const question = chatStore.newQAText
    const { selectedRow } = useWeblinkStore.getState()
    const { searchTarget } = useSearchStateStore.getState()

    let selectedWebLink: Source[] = []

    if (searchTarget === SearchTarget.SelectedPages) {
      selectedWebLink = selectedRow?.map(item => ({
        pageContent: "",
        metadata: {
          title: item?.content?.originPageTitle || "",
          source: item?.content?.originPageUrl || "",
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

  const runQuickActionTask = async (payload: QUICK_ACTION_TASK_PAYLOAD) => {
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
    return selectedRow?.map(item => ({
      pageContent: item?.content?.originPageDescription,
      metadata: {
        source: item?.content?.originPageUrl,
        title: item?.content?.originPageTitle,
      },
      score: -1,
    }))
  }

  // TODO: 临时关闭，用于开发调试
  // useEffect(() => {
  //   if (!token) return
  //   if (token) {
  //     // 从插件打开弹窗，给插件发消息
  //     handleSendMsgToExtension("success", token)

  //     // 从 Web 打开弹窗，给 opener 发消息
  //     window.close()
  //   }
  // }, [token])

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])

  return (
    <div className="home-container" style={{}}>
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
          {/* 暂时不支持中断 */}
          {/* {messageStateStore.taskType === TASK_TYPE.CHAT &&
            messageStateStore?.pending && (
              <div className="stop-reponse">
                <Button
                  type="outline"
                  className="btn"
                  style={{ background: "#64645F" }}
                  icon={<IconMinusCircle style={{ color: "#64645F" }} />}
                  onClick={buildShutdownTaskAndGenResponse}>
                  停止响应
                </Button>
              </div>
            )} */}
        </div>

        <div
          className={classNames("input-box-container", {
            "is-focused": isFocused,
          })}>
          <div
            className={classNames("input-box", {
              "is-focused": isFocused,
            })}>
            <TextArea
              ref={inputRef}
              className="message-input"
              autoFocus
              value={chatStore?.newQAText}
              onChange={value => {
                chatStore.setNewQAText(value)
              }}
              placeholder="基于网页进行提问任何内容..."
              onKeyDownCapture={e => handleKeyDown(e)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                borderRadius: 8,
                resize: "none",
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

                  {/** 第一版本不支持选择指定网页进行问答 */}
                  <SearchTargetSelector />
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

      <WeblinkList ref={weblinkListRef} />
    </div>
  )
}

export default Home
