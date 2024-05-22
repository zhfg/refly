import { Button, Input } from "@arco-design/web-react"
import { useRef, useState } from "react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import { useChatStore } from "@/stores/chat"
import { useWeblinkStore } from "@/stores/weblink"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"

// types
import {
  type Task,
  type Source,
  TASK_TYPE,
  type Message,
  MessageType,
  Conversation,
  LOCALE,
} from "@/types"
// utils
import { buildTask } from "@/utils/task"
import { useResetState } from "@/hooks/use-reset-state"
import { useConversationStore } from "@/stores/conversation"
import { buildConversation } from "@/utils/conversation"
import { useTaskStore } from "@/stores/task"
import { useNavigate } from "react-router-dom"
import { delay } from "@/utils/delay"
// request
import getThreadMessages from "@/requests/getThreadMessages"
// styles
import "./index.scss"
import { useQuickSearchStateStore } from "@/stores/quick-search-state"
import { useUserStore } from "@/stores/user"
import { IconSend } from "@arco-design/web-react/icon"
import { safeParseJSON } from "@/utils/parse"
import { useBuildTask } from "@/hooks/use-build-task"
import { useMessageStateStore } from "@/stores/message-state"

const TextArea = Input.TextArea

interface ChatInputProps {
  placeholder: string
  autoSize: { minRows: number; maxRows: number }
}

export const ChatInput = (props: ChatInputProps) => {
  const inputRef = useRef<RefTextAreaType>(null)
  // stores
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const taskStore = useTaskStore()
  const quickSearchStateStore = useQuickSearchStateStore()
  const messageStateStore = useMessageStateStore()
  // hooks
  const { resetState } = useResetState()
  const navigate = useNavigate()
  const [isFocused, setIsFocused] = useState(false)

  const { buildTaskAndGenReponse } = useBuildTask()

  const weblinkStore = useWeblinkStore()
  const [isFetching, setIsFetching] = useState(true)

  const handleGetThreadMessages = async (threadId: string) => {
    // 异步操作
    const res = await getThreadMessages({
      body: {
        threadId,
      },
    })

    const { newQAText } = useChatStore.getState()
    console.log("getThreadMessages", res)

    // 清空之前的状态
    resetState()

    // 设置会话和消息
    conversationStore.setCurrentConversation(res?.data as Conversation)

    //
    const messages = (res?.data?.messages || [])?.map(item => {
      const {
        content = "",
        relatedQuestions = [],
        sources,
        type,
        selectedWeblinkConfig = "", // 这里需要构建进来
        ...extraInfo
      } = item || {}

      return {
        ...extraInfo,
        data: {
          content,
          relatedQuestions,
          sources,
          type,
          selectedWeblinkConfig,
        },
      }
    })
    chatStore.setMessages(messages)
    chatStore.setNewQAText(newQAText)
  }

  const getSelectedWeblinkConfig = (
    messages: Message[] = [],
  ): {
    searchTarget: SearchTarget
    filter: Source[]
  } => {
    // 这里是获取第一个，早期简化策略，因为一开始设置之后，后续设置就保留
    const lastHumanMessage = messages?.find(
      item => item?.data?.type === MessageType.Human,
    )

    return safeParseJSON(lastHumanMessage?.data?.selectedWeblinkConfig)
  }

  const handleThread = async (threadId: string) => {
    try {
      setIsFetching(true)
      const { currentConversation } = useConversationStore.getState()
      const { task } = useTaskStore.getState()

      // 新会话，需要手动构建第一条消息
      if (chatStore.isNewConversation && currentConversation?.convId) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        buildTaskAndGenReponse(task as Task)
      } else if (
        chatStore.isAskFollowUpNewConversation &&
        currentConversation?.convId
      ) {
        // 先获取会话
        await handleGetThreadMessages(threadId)
        // 然后构建 followup question
        await handleAskFollowing()
      } else if (threadId) {
        handleGetThreadMessages(threadId)
      }

      // 重置状态
      chatStore.setNewQAText("")
      weblinkStore.updateSelectedRow([])
    } catch (err) {
      console.log("thread error")
    }

    await delay(1500)
    setIsFetching(false)
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

    // 创建新会话并跳转
    const newConversationPayload = buildConversation()
    conversationStore.setCurrentConversation(
      newConversationPayload as Conversation,
    )

    // 设置当前的任务类型及会话 id
    const task = buildTask({
      taskType:
        searchTarget === SearchTarget.SearchEnhance
          ? TASK_TYPE.SEARCH_ENHANCE_ASK
          : TASK_TYPE.CHAT,
      data: {
        question,
        filter: { weblinkList: selectedWebLink },
      },
      locale: localSettings?.outputLocale || LOCALE.EN,
      convId: newConversationPayload?.convId || "",
      createConvParam: { ...newConversationPayload },
    })
    taskStore.setTask(task)
    // 开始提问
    buildTaskAndGenReponse(task as Task)
    chatStore.setNewQAText("")
  }

  const handleAskFollowing = (
    question?: string,
    taskType: TASK_TYPE = TASK_TYPE.CHAT,
  ) => {
    // support ask follow up question
    let newQuestion = ""
    if (typeof question === "string" && question) {
      newQuestion = question
    } else {
      const { newQAText } = useChatStore.getState()
      newQuestion = newQAText
    }
    const { currentConversation } = useConversationStore.getState()
    const { messages } = useChatStore.getState()
    const selectedWeblinkConfig = getSelectedWeblinkConfig(messages)
    const { localSettings } = useUserStore.getState()

    const useWeblinkList =
      selectedWeblinkConfig?.searchTarget === SearchTarget.SelectedPages &&
      selectedWeblinkConfig?.filter?.length > 0

    const task = buildTask({
      data: {
        question: newQuestion,
        convId: currentConversation?.convId || "",
        filter: {
          weblinkList: useWeblinkList ? selectedWeblinkConfig?.filter : [],
        },
      },
      taskType: taskType as TASK_TYPE,
      locale: localSettings?.outputLocale || LOCALE.EN,
      convId: currentConversation?.convId || "",
    })

    buildTaskAndGenReponse(task)
    chatStore.setNewQAText("")
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

  console.log("messageState", messageStateStore.pendingFirstToken)

  return (
    <div className="ai-copilot-chat-input-container">
      <TextArea
        ref={inputRef}
        autoFocus
        value={chatStore?.newQAText}
        onChange={value => {
          chatStore.setNewQAText(value)
        }}
        onKeyDownCapture={e => handleKeyDown(e)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          borderRadius: 8,
          resize: "none",
        }}
        placeholder={props.placeholder}
        autoSize={props.autoSize}></TextArea>
      <div className="ai-copilot-chat-input-action">
        <Button
          shape="circle"
          loading={messageStateStore?.pending}
          icon={<IconSend />}
          disabled={messageStateStore?.pending}
          className="search-btn"
          style={{ color: "#FFF", background: "#00968F" }}
          onClick={() => {
            handleSendMessage()
          }}></Button>
      </div>
    </div>
  )
}
