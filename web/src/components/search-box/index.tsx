import classNames from "classnames"
import {
  Button,
  Input,
  Message as message,
  Space,
} from "@arco-design/web-react"
import { useEffect, useRef, useState } from "react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import { useChatStore } from "@/stores/chat"
import { useWeblinkStore } from "@/stores/weblink"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"

// types
import { type Task, type Source, Thread, TASK_TYPE, LOCALE } from "@/types"
// utils
import { buildTask } from "@/utils/task"
import { useResetState } from "@/hooks/use-reset-state"
import { useConversationStore } from "@/stores/conversation"
import { buildConversation } from "@/utils/conversation"
import { useTaskStore } from "@/stores/task"
import { useNavigate } from "react-router-dom"
// request
import createNewConversation from "@/requests/createNewConversation"
import { IconLanguage, IconSend } from "@arco-design/web-react/icon"
import { SearchTargetSelector } from "../dashboard/home-search-target-selector"
// styles
import "./index.scss"
import { useSiderStore } from "@/stores/sider"
import { useQuickSearchStateStore } from "@/stores/quick-search-state"
import { useUserStore } from "@/stores/user"
import { useTranslation } from "react-i18next"
import { OutputLocaleList } from "../output-locale-list"
import { localeToLanguageName } from "@/utils/i18n"
import { IconTip } from "../dashboard/icon-tip"

const TextArea = Input.TextArea

export const SearchBox = () => {
  // refs
  const inputRef = useRef<RefTextAreaType>(null)
  // stores
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const taskStore = useTaskStore()
  const siderStore = useSiderStore()
  const quickSearchStateStore = useQuickSearchStateStore()
  const userStore = useUserStore()
  // hooks
  const { resetState } = useResetState()
  const navigate = useNavigate()
  const [isFocused, setIsFocused] = useState(false)

  const { t, i18n } = useTranslation()
  const uiLocale = i18n?.languages?.[0] as LOCALE
  const outputLocale = userStore?.localSettings?.outputLocale

  const handleCreateNewConversation = async (task: Task) => {
    /**
     * 1. 创建新 thread，设置状态
     * 2. 跳转到 thread 界面，进行第一个回复，展示 问题、sources、答案
     */
    const { localSettings } = useUserStore.getState()
    const question = chatStore.newQAText
    const newConversationPayload = buildConversation()

    // 创建新会话
    const res = await createNewConversation({
      body: { ...newConversationPayload, locale: localSettings.outputLocale },
    })

    if (!res?.success) {
      message.error({
        content: t("loggedHomePage.homePage.status.createFailed"),
      })
      return
    }

    // 清空之前的状态
    resetState()

    console.log("createNewConversation", res)
    conversationStore.setCurrentConversation(res?.data as Thread)

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

  const runTask = () => {
    const question = chatStore.newQAText
    const { selectedRow } = useWeblinkStore.getState()
    const { searchTarget } = useSearchStateStore.getState()
    const { localSettings } = useUserStore.getState()

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
      locale: localSettings?.outputLocale,
    })

    // 创建新会话并跳转
    handleCreateNewConversation(task)
  }

  const handleSendMessage = () => {
    quickSearchStateStore.setVisible(false)
    runTask()
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
      handleSendMessage()
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      quickSearchStateStore.setVisible(true)
    }
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])

  return (
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
            placeholder={t("loggedHomePage.homePage.searchPlaceholder")}
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
                <OutputLocaleList>
                  <Button
                    type="text"
                    shape="round"
                    icon={<IconLanguage />}
                    className="setting-page-language-btn">
                    {localeToLanguageName?.[uiLocale]?.[outputLocale]}{" "}
                  </Button>
                </OutputLocaleList>
              </Space>
              <Button
                shape="circle"
                icon={<IconSend />}
                style={{ color: "#FFF", background: "#00968F" }}
                onClick={() => {
                  handleSendMessage()
                }}></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
