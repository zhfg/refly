import { Message as message } from "@arco-design/web-react"

import { sendToBackground } from "@plasmohq/messaging"
import { useChatStore } from "~stores/chat"
import { useConversationStore } from "~stores/conversation"
import { buildConversation } from "~utils/conversation"
import { useResetState } from "./use-reset-state"
import { useTaskStore } from "~stores/task"
import { useNavigate } from "react-router-dom"

// 类型
import {
  QUICK_ACTION_TYPE,
  type QUICK_ACTION_TASK_PAYLOAD,
  type Task,
  type Source,
  TASK_TYPE,
} from "~/types"
import { SearchTarget, useSearchStateStore } from "~stores/search-state"
import { buildQuickActionTask, buildTask } from "~utils/task"
import { useWeblinkStore } from "~stores/weblink"
import { useSelectedMark } from "./use-selected-mark"
import { useContentSelectorStore } from "~stores/content-selector"
import { useTranslation } from "react-i18next"
import { useUserStore } from "~stores/user"

export const useBuildThreadAndRun = () => {
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const { handleResetState } = useSelectedMark()
  const { resetState } = useResetState()
  const taskStore = useTaskStore()
  const navigate = useNavigate()

  const { t } = useTranslation()

  const handleCreateNewConversation = async (task: Task) => {
    const { localSettings } = useUserStore.getState()
    /**
     * 1. 创建新 thread，设置状态
     * 2. 跳转到 thread 界面，进行第一个回复，展示 问题、sources、答案
     */
    const question = chatStore.newQAText
    const newConversationPayload = buildConversation()

    // 创建新会话
    const res = await sendToBackground({
      name: "createNewConversation",
      body: { ...newConversationPayload, locale: localSettings?.outputLocale },
    })

    if (!res?.success) {
      message.error({
        content: t(
          "translation:hooks.useBuildThreadAndRun.status.createFailed",
        ),
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
    chatStore.setLoading(false)
    navigate(`/thread/${res?.data?.id}`)
  }

  const runTask = () => {
    const question = chatStore.newQAText
    const { selectedRow } = useWeblinkStore.getState()
    const { searchTarget } = useSearchStateStore.getState()
    const { marks } = useContentSelectorStore.getState()
    const { localSettings } = useUserStore.getState()

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
          selections: marks?.map((item) => ({
            type: "text",
            xPath: item?.xPath,
            content: item?.data,
          })),
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

    // 退出 content selector
    handleResetState()
    // 创建新会话并跳转
    handleCreateNewConversation(task)
  }

  const runQuickActionTask = async (payload: QUICK_ACTION_TASK_PAYLOAD) => {
    const { localSettings } = useUserStore.getState()

    const task = buildQuickActionTask(
      {
        question: t(
          "translation:hooks.useBuildThreadAndRun.task.summary.question",
        ),
        actionType: QUICK_ACTION_TYPE.SUMMARY,
        filter: payload?.filter,
        actionPrompt: t(
          "translation:hooks.useBuildThreadAndRun.task.summary.actionPrompt",
        ),
      },
      localSettings.outputLocale,
    )

    // 创建新会话并跳转
    handleCreateNewConversation(task)
  }

  return { handleCreateNewConversation, runQuickActionTask, runTask }
}
