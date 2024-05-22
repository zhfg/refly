import { Markdown } from "@/components/markdown"
import { ServerMessage } from "@/types"
import { copyToClipboard } from "@/utils"
import {
  Button,
  List,
  Skeleton,
  Spin,
  Typography,
} from "@arco-design/web-react"
import {
  IconCopy,
  IconQuote,
  IconReply,
  IconRight,
} from "@arco-design/web-react/icon"
import { useState } from "react"
import { useTranslation } from "react-i18next"

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
}) => {
  const { message, isPending = false, isLastSession = false } = props
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>)

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
        {(message?.sources || []).length > 0 ? (
          <div className="session-source-content">
            <div className="session-source-list">
              <List
                className="session-source-list-item"
                wrapperStyle={{ width: "100%" }}
                bordered={false}
                pagination={{ pageSize: 4 }}
                dataSource={message?.sources}
                scrollLoading={
                  (message?.sources || []).length > 0 ? null : scrollLoading
                }
                noDataElement={<div>{t("threadDetail.item.noMoreText")}</div>}
                render={(item, index) => (
                  <List.Item
                    key={index}
                    style={{
                      borderBottom: "0.5px solid var(--color-fill-3)",
                    }}
                    actionLayout="vertical"
                    actions={[
                      <span
                        key={1}
                        className="session-source-list-item-action"
                        onClick={() => {}}>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${item?.metadata?.source}&sz=${16}`}
                          alt={item?.metadata?.source}
                        />
                      </span>,
                      <a target="_blank" href={item.metadata?.source}>
                        <span
                          key={2}
                          className="session-source-list-item-action">
                          <Typography.Paragraph
                            ellipsis={{ rows: 1, wrapper: "span" }}
                            style={{
                              fontSize: 10,
                              color: "rgba(0, 0, 0, .4)",
                            }}>
                            · {item.metadata?.source} ·
                          </Typography.Paragraph>
                        </span>
                      </a>,
                      <span
                        key={2}
                        className="session-source-list-item-action"
                        style={{
                          fontSize: 10,
                          color: "rgba(0, 0, 0, .4)",
                        }}>
                        #{index + 1}
                      </span>,
                    ]}>
                    <List.Item.Meta
                      title={
                        <a href={item.metadata?.source}>
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(0, 0, 0, .8)",
                              fontWeight: "bold",
                            }}>
                            {item.metadata?.title}
                          </span>
                        </a>
                      }
                      description={
                        <Typography.Paragraph
                          ellipsis={{ rows: 1, wrapper: "span" }}
                          style={{
                            fontSize: 10,
                            color: "rgba(0, 0, 0, .8)",
                          }}>
                          {item.pageContent}
                        </Typography.Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        ) : isPending && isLastSession ? (
          <Skeleton animation></Skeleton>
        ) : null}
      </div>
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
              <div className="ai-copilot-related-question-item" key={index}>
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
