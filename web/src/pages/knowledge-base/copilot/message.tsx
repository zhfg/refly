import { Markdown } from "@/components/markdown"
import { useBuildThreadAndRun } from "@/hooks/use-build-thread-and-run"
import { useUserStore } from "@/stores/user"
import { ServerMessage } from "@/types"
import { copyToClipboard } from "@/utils"
import { Avatar, Button, Spin } from "@arco-design/web-react"
import { IconCopy, IconQuote, IconRight } from "@arco-design/web-react/icon"
import { useTranslation } from "react-i18next"
// 自定义组件
import { SourceList } from "@/components/source-list"

export const HumanMessage = (props: { message: Partial<ServerMessage> }) => {
  const { message } = props
  return (
    <div className="ai-copilot-message human-message-container">
      <div className="human-message">
        <Markdown content={message?.content as string} />
      </div>
    </div>
  )
}

export const AssistantMessage = (props: {
  message: Partial<ServerMessage>
  isPending: boolean
  isLastSession: boolean
  handleAskFollowing: (question?: string) => void
}) => {
  const {
    message,
    isPending = false,
    isLastSession = false,
    handleAskFollowing,
  } = props
  const { t } = useTranslation()

  return (
    <div className="ai-copilot-message assistant-message-container ">
      <div className="session-source">
        {isPending || (message?.sources || [])?.length > 0 ? (
          <div className="session-title-icon">
            <IconQuote style={{ fontSize: 18, color: "rgba(0, 0, 0, .5)" }} />
            <p>{t("threadDetail.item.session.source")}</p>
          </div>
        ) : null}
      </div>
      <SourceList
        isPending={isPending}
        sources={message?.sources || []}
        isLastSession={isLastSession}
      />
      <div className="assistant-message">
        <Markdown content={message?.content as string} />
      </div>
      {!isPending && (
        <div className="ai-copilot-answer-action-container">
          <div className="session-answer-actionbar">
            <div className="session-answer-actionbar-left">
              <Button
                type="text"
                icon={<IconCopy style={{ fontSize: 14 }} />}
                style={{ color: "#64645F" }}
                onClick={() => {
                  copyToClipboard(message?.content || "")
                }}>
                复制
              </Button>
            </div>
            <div className="session-answer-actionbar-right"></div>
          </div>
        </div>
      )}
      {isLastSession && (message?.relatedQuestions || []).length > 0 ? (
        <div className="ai-copilot-related-question-container">
          <div className="ai-copilot-related-question-list">
            {message?.relatedQuestions?.map((item, index) => (
              <div
                className="ai-copilot-related-question-item"
                key={index}
                onClick={() => handleAskFollowing(item)}>
                <p className="ai-copilot-related-question-title">{item}</p>
                <IconRight style={{ color: "rgba(0, 0, 0, 0.5)" }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export const PendingMessage = () => {
  return (
    <div className="ai-copilot-message assistant-message-container">
      <div className="assistant-message">
        <Spin dot size={4} />
      </div>
    </div>
  )
}

export const WelcomeMessage = () => {
  const userStore = useUserStore()
  const { runTask } = useBuildThreadAndRun()
  const guessQuestions = [
    "总结选中内容要点",
    "脑暴写作灵感",
    "写一篇 Twitter 原创文章",
  ]
  return (
    <div className="ai-copilot-message welcome-message-container">
      <div className="welcome-message">
        <div className="welcome-message-user-container">
          <div className="user-container-avatar">
            <Avatar>
              <img src={userStore?.userProfile?.avatar || ""} />
            </Avatar>
          </div>
          <div className="user-container-title">
            Hello, {userStore?.userProfile?.name}
          </div>
        </div>
        <div className="welcome-message-text">How can I help you today?</div>
        <div className="welcome-message-guess-you-ask-container ai-copilot-related-question-container">
          <div className="guess-you-ask-assist"></div>
          <div className="guess-you-ask ai-copilot-related-question-lis">
            {guessQuestions?.map((item, index) => (
              <div
                className="ai-copilot-related-question-item"
                key={index}
                onClick={() => runTask(item)}>
                <p className="ai-copilot-related-question-title">{item}</p>
                <IconRight style={{ color: "rgba(0, 0, 0, 0.5)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
