import { Button } from "@arco-design/web-react"
import React, { useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"

// hooks
import { useResetState } from "~hooks/use-reset-state"
// stores
import { useChatStore } from "~stores/chat"
import { useConversationStore } from "~stores/conversation"
import { useThreadStore } from "~stores/thread"
// utils
import { buildSessions } from "~utils/session"
import { buildChatTask, buildTask } from "~utils/task"
// 组件
import { ThreadItem } from "~components/thread-item/thread-item"
import { sendToBackground } from "@plasmohq/messaging"
import { Header } from "./header"
import { useBuildTask } from "~hooks/use-build-task"
import { useTaskStore } from "~stores/task"
import { MessageType, type Message, TASK_TYPE } from "~types"
import { safeParseJSON } from "~utils/parse"
import { useWeblinkStore } from "~stores/weblink"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
import { useContentSelectorStore } from "~stores/content-selector"

export const Thread = () => {
  const { buildTaskAndGenReponse } = useBuildTask()
  const params = useParams<{ threadId: string }>()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const threadStore = useThreadStore()
  const weblinkStore = useWeblinkStore()
  const searchStateStore = useSearchStateStore()
  const { resetState } = useResetState()

  const handleGetThreadMessages = async (threadId: string) => {
    const threadIdMap = threadStore?.threads?.find(
      (item) => item?.id === threadId,
    )
    // 异步操作
    const res = await sendToBackground({
      name: "getThreadMessages",
      body: {
        threadId,
      },
    })

    console.log("getThreadMessages", res)

    // 清空之前的状态
    resetState()

    // 设置会话和消息
    conversationStore.setCurrentConversation(res?.data)

    //
    const messages = (res?.data?.messages || [])?.map((item) => {
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
  }

  const handleAskFollowing = (question?: string, taskType?: TASK_TYPE) => {
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
    const { marks } = useContentSelectorStore.getState()

    console.log("handleAskFollowing", newQuestion)

    const getWebLinkList = () => {
      let selectedWebLink = []
      if (selectedWeblinkConfig?.searchTarget === SearchTarget.CurrentPage) {
        selectedWebLink = [
          {
            pageContent: "",
            metadata: {
              title: document?.title || "",
              source: location.href,
            },
            score: -1, // 手工构造
            cssSelector: marks?.map((item) => item?.cssSelector),
          },
        ]
      } else {
        const useWeblinkList =
          selectedWeblinkConfig?.searchTarget === SearchTarget.SelectedPages &&
          selectedWeblinkConfig?.filter?.length > 0

        selectedWebLink = useWeblinkList ? selectedWeblinkConfig?.filter : []
      }

      return selectedWebLink
    }

    const task = buildTask({
      data: {
        question: newQuestion,
        conversationId: currentConversation?.id || "",
        filter: {
          weblinkList: getWebLinkList(),
        },
      },
      taskType,
    })
    buildTaskAndGenReponse(task)
    chatStore.setNewQAText("")
  }

  const getSelectedWeblinkConfig = (messages: Message[] = []) => {
    // 这里是获取第一个，早期简化策略，因为一开始设置之后，后续设置就保留
    const lastHumanMessage = messages?.find(
      (item) => item?.data?.type === MessageType?.Human,
    )

    return safeParseJSON(lastHumanMessage?.data?.selectedWeblinkConfig)
  }

  const handleThread = async (threadId: string) => {
    const { currentConversation } = useConversationStore.getState()
    const { messages = [] } = useChatStore.getState()
    const { task } = useTaskStore.getState()

    // 新会话，需要手动构建第一条消息
    if (chatStore.isNewConversation && currentConversation?.id) {
      // 更换成基于 task 的消息模式，核心是基于 task 来处理
      buildTaskAndGenReponse(task)
      chatStore.setIsNewConversation(false)
    } else if (params?.threadId) {
      handleGetThreadMessages(threadId)
    }

    // 重置状态
    chatStore.setNewQAText("")
    weblinkStore.updateSelectedRow([])
    searchStateStore.setSearchTarget(SearchTarget.CurrentPage)
  }

  useEffect(() => {
    handleThread(params.threadId)
  }, [])

  console.log("thread message", chatStore.messages)
  const sessions = buildSessions(chatStore.messages)
  const selectedWeblinkConfig = getSelectedWeblinkConfig(chatStore.messages)

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <Header thread={conversationStore.currentConversation} />
      <ThreadItem
        sessions={sessions}
        selectedWeblinkConfig={selectedWeblinkConfig}
        handleAskFollowing={handleAskFollowing}
      />
    </div>
  )
}
