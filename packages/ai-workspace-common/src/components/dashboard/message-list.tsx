import { Button, Spin } from "@arco-design/web-react"
import React from "react"

import { ChatMessage } from "@refly/openapi-schema"
import type { RecommendQuestionItem } from "@refly/common-types"

import { Markdown } from "../markdown"

export const ExampleQuestionItem = (msg: RecommendQuestionItem) => (
  <>
    <p>{msg.title}</p>
    <Button shape="round">{msg.question}</Button>
  </>
)

export const ReplyMessage = (msg: ChatMessage) => (
  <div className="message-item">
    <p>
      <Markdown content={msg?.content} />
    </p>
  </div>
)

export const QuestionMessage = (msg: ChatMessage) => (
  <div className="message-item">
    <p>{msg?.content}</p>
  </div>
)

export const IntentMessage = (msg: ChatMessage) => (
  <div className="message-item">
    <p className="chat-intent-title">您选择的文本</p>
    <p>{msg?.content}</p>
  </div>
)

export const ErrorMessage = (msg: ChatMessage) => (
  <div className="message-item">
    <p>{msg?.content}</p>
  </div>
)

export const LoadingMessage = () => (
  <div className="message-item">
    <p>
      <Spin dot size={4} className="loading-icon" />
    </p>
  </div>
)

export const UnSupportedMessage = (msg: ChatMessage) => (
  <div className="message-item">
    <p>{msg?.content}</p>
  </div>
)

const MessageList = () => {
  return <div>hello</div>
}

export default MessageList
