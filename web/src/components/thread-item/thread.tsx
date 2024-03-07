import React, { useEffect } from "react"
import { useParams } from "react-router-dom"

// hooks
import { useSiderSendMessage } from "@/hooks/use-sider-send-message"
import { useResetState } from "@/hooks/use-reset-state"
// stores
import { useChatStore } from "@/stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useThreadStore } from "@/stores/thread"
// utils
import { buildSessions } from "@/utils/session"
// 组件
import { ThreadItem } from "@/components/thread-item/thread-item"
import { Header } from "./header"
// request
import getThreadMessages from "@/requests/getThreadMessages"
// styles
import "./thread-item.scss"

export const Thread = () => {
  const { handleSideSendMessage } = useSiderSendMessage()
  const params = useParams<{ threadId: string }>()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const threadStore = useThreadStore()
  const { resetState } = useResetState()

  const handleGetThreadMessages = async (threadId: string) => {
    const threadIdMap = threadStore?.threads?.find(
      item => item?.id === threadId,
    )
    // 异步操作
    const res = await getThreadMessages({
      body: {
        threadId: threadIdMap?.conversationId as string,
      },
    })

    console.log("getThreadMessages", res)

    // 清空之前的状态
    resetState()

    // 设置会话和消息
    conversationStore.setCurrentConversation(res?.data)

    //
    const messages = (res?.data?.messages || [])?.map(item => {
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
    // 新会话，需要手动构建第一条消息
    if (chatStore.isNewConversation) {
      const question = chatStore.newQAText
      console.log(
        "handleThread",
        chatStore.isNewConversation,
        chatStore.newQAText,
      )
      handleSideSendMessage(question)
      chatStore.setIsNewConversation(false)
    } else {
      handleGetThreadMessages(threadId)
    }
  }

  useEffect(() => {
    handleThread(params?.threadId as string)
  }, [params?.threadId])

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
