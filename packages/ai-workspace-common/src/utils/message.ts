import { MessageDataType, MessageItemType, QuestionType, ReplyType, SystemAction } from '@refly/common-types';

import { ChatMessage, MessageType } from '@refly/openapi-schema';
import { genChatMessageID } from '@refly-packages/utils/id';

export const unsupportedMessage = '暂不支持的消息类型，请更新版本之后重试';
export const errorMessage = 'AbortError: The user aborted a request.';

/**
 * 1. 这个不是消息的一部分，是可动态配置的，独特展示的
 */
export const systemExampleQuestions = [
  {
    type: SystemAction.RecommendQuestion,
    title: '🤔 提出复杂问题',
    question: '如何在 JavaScript 中建立 WebSocket 连接？',
  },
  {
    type: SystemAction.RecommendQuestion,
    title: '👍 获取更多灵感',
    question: '为一家做 PaaS 的科技公司起一个名字。',
  },
];

// 系统希望用户进行的推荐
export const systemRecommendOperation = [
  {
    title: '🎁 推荐好友赚奖励',
  },
  {
    title: '❤️ 支持我们',
  },
];

/**
 * 默认回复语：
 *
 * - Welcome 回复
 * - Selection Intent 回复
 */
export const defaultReplyContent = {
  Welcome: '你好啊，欢迎回来！',
  Intent: '您希望对文本进行什么操作？',
};

// 每次随机选三个
export const suggestionsQuestions = [
  {
    text: '如何在 JavaScript 中发出 HTTP 请求？',
  },
  {
    text: '什么是大型语言模型？',
  },
  {
    text: '如何应对难缠的老板？',
  },
  {
    text: '世界上最高的山峰',
  },
];

// 生成随机数的函数
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getRandomSuggestionsQuestion = (k: number) => {
  // 随机生成 3 个数
  const len = suggestionsQuestions.length;
  const randomNums: number[] = [];
  while (randomNums.length < k) {
    const index = getRandomInt(0, len - 1);
    if (!randomNums.includes(index)) {
      randomNums.push(index);
    }
  }

  const randomReplies = randomNums.map((num) => suggestionsQuestions[num]);

  return randomReplies;
};

export const buildQuestionMessage = (data: Partial<ChatMessage>): ChatMessage => {
  const { content = '', selectedWeblinkConfig = '', skillMeta } = data;

  return {
    msgId: genChatMessageID(),
    type: 'human',
    content,
    selectedWeblinkConfig,
    skillMeta,
  };
};

export const buildReplyMessage = (data: Partial<ChatMessage>): ChatMessage => {
  const { content = '', skillMeta } = data;

  return {
    type: 'ai',
    msgId: genChatMessageID(),
    content,
    skillMeta,
  };
};

/**
 *  生成某条消息时，还未开始生成第一个字符就被 abort
 *  1. 只用于前端展示，不保存在服务端
 *
 */
export const buildErrorMessage = (data: Partial<ChatMessage>): ChatMessage => {
  const { content = errorMessage, skillMeta } = data;

  return {
    type: 'ai',
    msgId: genChatMessageID(),
    content,
    skillMeta,
  };
};
