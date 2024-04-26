import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Helmet } from "react-helmet"

// hooks
import { useResetState } from "@/hooks/use-reset-state"
import { useBuildTask } from "@/hooks/use-build-task"
// stores
import { useChatStore } from "@/stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useTaskStore } from "@/stores/task"
// utils
import { buildSessions } from "@/utils/session"
// 组件
import { ThreadItem } from "@/components/thread-item/thread-item"
import { Header } from "./header"
// request
import getThreadMessages from "@/requests/getThreadMessages"
// styles
import "./thread-item.scss"
import {
  Task,
  Thread as ThreadTypes,
  type Message,
  MessageType,
  Source,
  Thread as IThread,
  TASK_TYPE,
} from "@/types"
import { useWeblinkStore } from "@/stores/weblink"
import { useSearchStateStore, SearchTarget } from "@/stores/search-state"
import { safeParseJSON } from "@/utils/parse"
import { buildTask } from "@/utils/task"
import { Skeleton } from "@arco-design/web-react"
import { useUserStore } from "@/stores/user"
import { EmptyDigestTopicDetailStatus } from "../empty-digest-topic-detail-status"
import { useTranslation } from "react-i18next"

export const Thread = () => {
  const { buildTaskAndGenReponse } = useBuildTask()
  const params = useParams<{ threadId: string }>()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const weblinkStore = useWeblinkStore()
  const searchStateStore = useSearchStateStore()
  const { resetState } = useResetState()
  const [isFetching, setIsFetching] = useState(false)
  const { t } = useTranslation()

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
    conversationStore.setCurrentConversation(res?.data as ThreadTypes)

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
        conversationId: currentConversation?.id || "",
        filter: {
          weblinkList: useWeblinkList ? selectedWeblinkConfig?.filter : [],
        },
      },
      taskType: taskType as TASK_TYPE,
      locale: localSettings?.outputLocale,
    })

    buildTaskAndGenReponse(task)
    chatStore.setNewQAText("")
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
      if (chatStore.isNewConversation && currentConversation?.id) {
        // 更换成基于 task 的消息模式，核心是基于 task 来处理
        buildTaskAndGenReponse(task as Task)
      } else if (
        chatStore.isAskFollowUpNewConversation &&
        currentConversation?.id
      ) {
        // 先获取会话
        await handleGetThreadMessages(threadId)
        // 然后构建 followup question
        await handleAskFollowing()
      } else if (params?.threadId) {
        handleGetThreadMessages(threadId)
      }

      // 重置状态
      chatStore.setNewQAText("")
      weblinkStore.updateSelectedRow([])
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage)
    } catch (err) {
      console.log("thread error")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (params?.threadId) {
      console.log("params", params)
      handleThread(params?.threadId as string)
    }

    return () => {
      chatStore.resetState()
    }
  }, [params?.threadId])

  const sessions = buildSessions(chatStore.messages)
  const selectedWeblinkConfig = getSelectedWeblinkConfig(chatStore.messages)

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <Helmet>
        <title>{conversationStore?.currentConversation?.title}</title>
        <meta
          name="description"
          content={conversationStore?.currentConversation?.lastMessage}
        />
      </Helmet>
      <Header thread={conversationStore?.currentConversation as IThread} />
      {isFetching ? (
        <div style={{ maxWidth: "748px", width: "748px", margin: "20px auto" }}>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
        </div>
      ) : !isFetching && (sessions || [])?.length === 0 ? (
        <EmptyDigestTopicDetailStatus text={t("threadDetail.empty.title")} />
      ) : (
        <ThreadItem
          sessions={sessions}
          selectedWeblinkConfig={selectedWeblinkConfig}
          handleAskFollowing={handleAskFollowing}
        />
      )}
    </div>
  )
}
