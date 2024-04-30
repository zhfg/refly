import { Spin, Alert } from "@arco-design/web-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Session } from "~components/thread-item/session"
import { ThreadItem } from "~components/thread-item/thread-item"
import type { WebLinkItem } from "~components/weblink-list/types"
import { useQuickActionHandler } from "~hooks/use-quick-action-handler"
import { useChatStore } from "~stores/chat"
import { useWeblinkStore } from "~stores/weblink"
import type { SessionItem, Source } from "~types"
import { buildSessions } from "~utils/session"
import { buildSource } from "~utils/weblink"

export const CurrentWeblinkQuickSummary = () => {
  const { currentWeblink } = useWeblinkStore()
  const { dryRunSummarize } = useQuickActionHandler()
  const handledFlagRef = useRef(false)
  const { t } = useTranslation()
  const chatStore = useChatStore()

  // 是否在处理网页
  const isProcessingParse = currentWeblink?.parseStatus === "processing"
  const isFailedToServerCrawl = currentWeblink?.parseStatus === "failed"
  const isParseSuccessfully = currentWeblink?.parseStatus === "finish"
  const alreadySummarize = !!currentWeblink?.summary

  const buildSessionsForQuickSummary = (weblinkItem: WebLinkItem) => {
    const { summary, relatedQuestions } = weblinkItem

    const description = document.head.querySelector('meta[name="description"]')
    const source = buildSource({
      pageContent: (description as any)?.content || "",
      metadata: {
        source: location.origin || "",
        title: document.title || "",
      },
      score: -1,
    })

    const session: SessionItem = {
      question: t(
        "translation:components.currentWeblinkQuickSummary.message.question",
      ),
      answer: summary,
      sources: [source],
      relatedQuestions: relatedQuestions,
    }

    return [session]
  }

  const handleAskFollowing = (question: string) => {}

  // 每次开始一个新网页，则将 flag 标识为未处理
  useEffect(() => {
    if (isProcessingParse) {
      handledFlagRef.current = false
    }
  }, [isProcessingParse])
  useEffect(() => {
    // 如果准备就绪，且没有进行总结过，则发起快速总结，不用创建新会话，所以新会话应该解耦开
    if (isParseSuccessfully && !alreadySummarize && !handledFlagRef.current) {
      handledFlagRef.current = true

      const filter = {
        weblinkList: [
          {
            pageContent: "",
            metadata: {
              title: document?.title || "",
              source: location.href,
            },
            score: -1,
          } as Source,
        ],
      }

      dryRunSummarize({ filter })
    }
  }, [isParseSuccessfully])

  const sessions = alreadySummarize
    ? buildSessionsForQuickSummary(currentWeblink)
    : buildSessions(chatStore?.messages)

  return (
    <div className="current-weblink-quick-summary-container">
      {isProcessingParse && (
        <div className="current-weblink-quick-summary-processing">
          <Spin tip="正在处理网页..." />
        </div>
      )}
      {isFailedToServerCrawl && (
        <Alert
          type="warning"
          closable
          content="网页抓取失败，请手动触发快捷操作或聊天"
        />
      )}
      {isParseSuccessfully && (
        <Alert type="success" closable content="网页已处理，获取总结中..." />
      )}
      {isParseSuccessfully ? (
        <Session
          session={sessions?.[0]}
          isLastSession={true}
          handleAskFollowing={(item) => handleAskFollowing(item)}
        />
      ) : null}
    </div>
  )
}
