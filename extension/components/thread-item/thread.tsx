import { Button, Skeleton } from "@arco-design/web-react"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"

// hooks
import { useResetState } from "~hooks/use-reset-state"
// stores
import { useChatStore } from "~stores/chat"
import { useConversationStore } from "~stores/conversation"
import { useThreadStore } from "~stores/thread"
// utils
import { buildSessions } from "~utils/session"
import { buildTask } from "~utils/task"
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
import { useUserStore } from "~stores/user"
import { delay } from "~utils/delay"
import { useTranslation } from "react-i18next"
import { EmptyThreadDetailStatus } from "~components/empty-thread-detail-status"

export const Thread = () => {
  const { buildTaskAndGenReponse } = useBuildTask()
  const params = useParams<{ threadId: string }>()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const threadStore = useThreadStore()
  const weblinkStore = useWeblinkStore()
  const searchStateStore = useSearchStateStore()
  const { resetState } = useResetState()
  const [isFetching, setIsFetching] = useState(true)

  const { t } = useTranslation()

  const handleGetThreadMessages = async (threadId: string) => {
    const threadIdMap = threadStore?.threads?.find(
      (item) => item?.convId === threadId,
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

  const getSelectedWeblinkConfig = (messages: Message[] = []) => {
    // 这里是获取第一个，早期简化策略，因为一开始设置之后，后续设置就保留
    const lastHumanMessage = messages?.find(
      (item) => item?.data?.type === MessageType?.Human,
    )

    return safeParseJSON(lastHumanMessage?.data?.selectedWeblinkConfig)
  }

  const handleThread = async (threadId: string) => {
    setIsFetching(true)
    const { currentConversation } = useConversationStore.getState()
    const { messages = [] } = useChatStore.getState()
    const { task } = useTaskStore.getState()

    // 新会话，需要手动构建第一条消息
    if (chatStore.isNewConversation && currentConversation?.convId) {
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

    await delay(1500)
    setIsFetching(false)
  }

  useEffect(() => {
    handleThread(params.threadId)
  }, [])

  const sessions = buildSessions(chatStore.messages)
  const selectedWeblinkConfig = getSelectedWeblinkConfig(chatStore.messages)

  console.log("selectedWeblinkConfig", selectedWeblinkConfig)

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <Header thread={conversationStore.currentConversation} />
      {isFetching ? (
        <div style={{ width: "calc(100% - 32px)", margin: "20px auto" }}>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
        </div>
      ) : !isFetching && (sessions || [])?.length === 0 ? (
        <EmptyThreadDetailStatus
          text={t("translation:threadDetail.empty.title")}
        />
      ) : (
        <ThreadItem
          sessions={sessions}
          selectedWeblinkConfig={selectedWeblinkConfig}
        />
      )}
    </div>
  )
}
