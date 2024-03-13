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
// 组件
import { ThreadItem } from "~components/thread-item/thread-item"
import { sendToBackground } from "@plasmohq/messaging"
import { Header } from "./header"
import { useBuildTask } from "~hooks/use-build-task"
import { useTaskStore } from "~stores/task"

export const Thread = () => {
  const { buildTaskAndGenReponse } = useBuildTask()
  const params = useParams<{ threadId: string }>()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const threadStore = useThreadStore()
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
        ...extraInfo
      } = item || {}

      return {
        ...extraInfo,
        data: {
          content,
          relatedQuestions,
          sources,
        },
      }
    })
    chatStore.setMessages(messages)
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
    } else if (params?.threadId && messages?.length === 0) {
      handleGetThreadMessages(threadId)
    }

    chatStore.setNewQAText("")
  }

  useEffect(() => {
    handleThread(params.threadId)
  }, [])

  console.log("thread message", chatStore.messages)
  const sessions = buildSessions(chatStore.messages)

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <Header />
      <ThreadItem sessions={sessions} />
    </div>
  )
}
