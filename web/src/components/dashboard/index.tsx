import {
  Button,
  Input,
  Message as message,
  Space,
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconBulb,
  IconDown,
  IconHistory,
  IconSend,
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import {
  type Task,
  QUICK_ACTION_TYPE,
  type QUICK_ACTION_TASK_PAYLOAD,
  type Source,
  Thread,
  TASK_TYPE,
} from "@/types"

// 自定义组件
import WeblinkList from "../weblink-list"
import { SelectedWeblink } from "../selected-weblink/index"
import { DigestArchive } from "@/pages/digest-timeline"
import { DigestToday } from "@/pages/digest-today"
// utils
import { buildConversation } from "@/utils/conversation"
import { buildQuickActionTask, buildTask } from "@/utils/task"
// 自定义方法
// stores
import { useChatStore } from "../../stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useSiderStore } from "@/stores/sider"
import { useWeblinkStore } from "@/stores/weblink"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { useTaskStore } from "@/stores/task"
// hooks
import { useResetState } from "@/hooks/use-reset-state"
// 组件
import { SearchTargetSelector } from "./home-search-target-selector"
import { QuickAction } from "./quick-action"
// request
import createNewConversation from "@/requests/createNewConversation"
// scss
import "./index.scss"
import classNames from "classnames"
import { useCookie } from "react-use"
// types
import type { WebLinkItem } from "@/types/weblink"
import { useUserStore } from "@/stores/user"
import { getExtensionId } from "@/utils/url"

const TextArea = Input.TextArea

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
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  // hooks
  const { resetState } = useResetState()

  // 基于 query 参数判断是 digest 还是归档，默认是归档
  const [searchParams] = useSearchParams()
  const isTimeline = searchParams.get("type")

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
    if (e.keyCode === 13 && (e.ctrlKey || e.shiftKey || e.metaKey)) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // 阻止默认行为,即不触发 enter 键的默认事件
        e.preventDefault()
        // 在输入框中插入换行符

        // 获取光标位置
        const cursorPos = e.target.selectionStart
        // 在光标位置插入换行符
        e.target.value =
          e.target.value.slice(0, cursorPos as number) +
          "\n" +
          e.target.value.slice(cursorPos as number)
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd =
          (cursorPos as number) + 1
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault()
      runTask()
    }
  }

  const handleSendMsgToExtension = async (
    status: "success" | "failed",
    token?: string,
  ) => {
    try {
      await chrome.runtime.sendMessage(getExtensionId(), {
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
  }

  const runTask = () => {
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

    const task = buildTask({
      taskType:
        searchTarget === SearchTarget.SearchEnhance
          ? TASK_TYPE.SEARCH_ENHANCE_ASK
          : TASK_TYPE.CHAT,
      data: {
        question,
        filter: { weblinkList: selectedWebLink },
      },
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
      pageContent: item?.content?.originPageDescription || "",
      metadata: {
        source: item?.content?.originPageUrl || "",
        title: item?.content?.originPageTitle || "",
      },
      score: -1,
    }))
  }

  const handleScrollToMemory = () => {
    const elem = document.querySelector(".content-layout")
    elem?.scroll({
      behavior: "smooth",
      top: elem?.scrollHeight,
    })
  }

  // TODO: 临时关闭，用于开发调试
  console.log("token", token)
  useEffect(() => {
    if (!(token || userStore?.userProfile?.id)) return

    const reflyLoginStatus = localStorage.getItem("refly-login-status")
    console.log("reflyLoginStatus", reflyLoginStatus, token)
    if ((token || userStore?.userProfile?.id) && reflyLoginStatus) {
      // 从插件打开弹窗，给插件发消息
      handleSendMsgToExtension("success", token as string)
      localStorage.removeItem("refly-login-status")
      // localStorage.setItem(
      //   "refly-user-profile",
      //   safeStringifyJSON(userStore?.userProfile),
      // )
      setTimeout(() => {
        window.close()
      }, 500)
    }
  }, [token, userStore?.userProfile?.id])

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])

  return (
    <div className="home-container" style={{}}>
      <div className="home-search-container">
        <div className="footer input-panel home-search-inner-container">
          <div className="refly-slogan">The answer engine for your work</div>
          <div className="actions"></div>

          <div
            className={classNames("input-box-container", {
              "is-focused": isFocused,
            })}>
            <div
              className={classNames("search-box-container", {
                "search-box-container-active": isFocused,
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
                  placeholder="Search For Refly..."
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
                      <SearchTargetSelector />
                    </Space>
                    <Button
                      shape="circle"
                      icon={<IconSend />}
                      style={{ color: "#FFF", background: "#00968F" }}
                      onClick={() => runTask()}></Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="search-assist-container">
              <Button icon={<IconBulb />} className="search-assist-btn">
                换一批推荐
              </Button>
              <Button
                icon={<IconHistory />}
                className="search-assist-btn"
                onClick={handleScrollToMemory}>
                查看回忆
              </Button>
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
          {webLinkStore?.selectedRow?.length > 0 ? <QuickAction /> : null}
        </div>
        <WeblinkList ref={weblinkListRef} />
      </div>
      {isTimeline ? <DigestArchive /> : <DigestToday />}
    </div>
  )
}

export default Home
