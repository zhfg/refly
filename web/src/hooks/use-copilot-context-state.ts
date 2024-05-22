import { useChatStore } from "@/stores/chat"
import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { SearchTarget, useSearchStateStore } from "@/stores/search-state"
import { Message, MessageType, ServerMessage } from "@/types"
import { mapToServerMessage } from "@/utils/message"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

const checkShowRelatedQuestion = (messsages: ServerMessage[] = []) => {
  const message = messsages?.[messsages.length - 1]
  if (!message) return false

  if (
    message?.type === MessageType.Assistant &&
    (message?.relatedQuestions || [])?.length > 0
  )
    return true

  return false
}

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(80)
  const searchStateStore = useSearchStateStore()
  const chatStore = useChatStore()
  const knowledgeBaseStore = useKnowledgeBaseStore()

  const [queryParams] = useSearchParams()
  const resId = queryParams.get("resId")
  const kbId = queryParams.get("kbId")

  const showContextState = !!resId || !!kbId
  const isCurrentPageSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentPage
  const isCurrentKnowledgeBaseSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentKnowledgeBase

  const currentResource = knowledgeBaseStore.currentResource
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase

  const showResourceContext = showContextState && isCurrentPageSelected
  const showKnowledgeBaseContext =
    showContextState && isCurrentKnowledgeBaseSelected

  const showContextCard = showResourceContext || showKnowledgeBaseContext

  // 是否展示 related questions
  const showRelatedQuestions = checkShowRelatedQuestion(
    mapToServerMessage(chatStore?.messages),
  )

  const calcContextCardHeight = () => {
    const elem = document.querySelector(
      ".ai-copilot-context-state-display-container",
    )
    const height = elem?.clientHeight || 0
    setContextCardHeight(height)
  }

  useEffect(() => {
    calcContextCardHeight()
  }, [showResourceContext, showKnowledgeBaseContext])

  return {
    showContextCard,
    showResourceContext,
    showRelatedQuestions,
    showKnowledgeBaseContext,
    currentResource,
    currentKnowledgeBase,
    contextCardHeight,
  }
}
