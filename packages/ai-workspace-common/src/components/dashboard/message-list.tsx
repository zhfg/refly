import { Button, Spin } from '@arco-design/web-react';
import React from 'react';

import type { Message, RecommendQuestionItem } from '@refly-packages/ai-workspace-common/types';

import { Markdown } from '../markdown';

export const ExampleQuestionItem = (msg: RecommendQuestionItem) => (
  <>
    <p>{msg.title}</p>
    <Button shape="round">{msg.question}</Button>
  </>
);

export const ReplyMessage = (msg: Message) => (
  <div className="message-item">
    <p>
      <Markdown content={msg?.data?.content} />
    </p>
  </div>
);

export const QuestionMessage = (msg: Message) => (
  <div className="message-item">
    <p>{msg?.data?.content}</p>
  </div>
);

export const IntentMessage = (msg: Message) => (
  <div className="message-item">
    <p className="chat-intent-title">您选择的文本</p>
    <p>{msg?.data?.content}</p>
  </div>
);

export const ErrorMessage = (msg: Message) => (
  <div className="message-item">
    <p>{msg?.data?.content}</p>
  </div>
);

export const LoadingMessage = () => (
  <div className="message-item">
    <p>
      <Spin dot size={4} className="loading-icon" />
    </p>
  </div>
);

export const UnSupportedMessage = (msg: Message) => (
  <div className="message-item">
    <p>{msg?.data?.content}</p>
  </div>
);

const MessageList = () => {
  return <div>hello</div>;
};

export default MessageList;
