import {
  Message,
  MessageDataType,
  MessageItemType,
  MessageType,
  QuestionType,
  ReplyType,
  ServerMessage,
  SystemAction,
} from "@/types"

import { genUniqueId } from "./index"
import { safeParseJSON } from "./parse"

export const unsupportedMessage = "暂不支持的消息类型，请更新版本之后重试"
export const errorMessage = "AbortError: The user aborted a request."

/**
 * 1. 这个不是消息的一部分，是可动态配置的，独特展示的
 */
export const systemExampleQuestions = [
  {
    type: SystemAction.RecommendQuestion,
    title: "🤔 提出复杂问题",
    question: "如何在 JavaScript 中建立 WebSocket 连接？",
  },
  {
    type: SystemAction.RecommendQuestion,
    title: "👍 获取更多灵感",
    question: "为一家做 PaaS 的科技公司起一个名字。",
  },
]

// 系统希望用户进行的推荐
export const systemRecommendOperation = [
  {
    title: "🎁 推荐好友赚奖励",
  },
  {
    title: "❤️ 支持我们",
  },
]

/**
 * 默认回复语：
 *
 * - Welcome 回复
 * - Selection Intent 回复
 */
export const defaultReplyContent = {
  Welcome: "你好啊，欢迎回来！",
  Intent: "您希望对文本进行什么操作？",
}

// 每次随机选三个
export const suggestionsQuestions = [
  {
    text: "如何在 JavaScript 中发出 HTTP 请求？",
  },
  {
    text: "什么是大型语言模型？",
  },
  {
    text: "如何应对难缠的老板？",
  },
  {
    text: "世界上最高的山峰",
  },
]

// 生成随机数的函数
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const getRandomSuggestionsQuestion = (k: number) => {
  // 随机生成 3 个数
  const len = suggestionsQuestions.length
  const randomNums: number[] = []
  while (randomNums.length < k) {
    const index = getRandomInt(0, len - 1)
    if (!randomNums.includes(index)) {
      randomNums.push(index)
    }
  }

  const randomReplies = randomNums.map(num => suggestionsQuestions[num])

  return randomReplies
}

export type BuildMessageData = {
  convId: string
  content?: string
  questionType?: QuestionType
  replyType?: ReplyType
  intentId?: string
  questionId?: string
  // 每次提问完在 human message 上加一个提问的 filter，这样之后追问时可以 follow 这个 filter 规则
  // 这里是前端同步的状态，后续获取新的消息之后，取存储的 last human message 的配置
  selectedWeblinkConfig?: string
}

export const buildWelcomeMessage = (data: BuildMessageData) => {
  const message = buildReplyMessage({
    ...data,
    content: defaultReplyContent.Welcome,
    replyType: ReplyType.WELCOME,
  })

  return message
}
export const buildIntentMessage = (data: BuildMessageData) => {
  const { convId = "", content = "" } = data

  const itemId = `intent:${genUniqueId()}`
  const replyMsg = buildReplyMessage({
    convId,
    content: defaultReplyContent.Intent,
    replyType: ReplyType.INTENT,
    intentId: itemId,
  })
  const message = {
    itemId,
    itemType: MessageItemType.INTENT,
    convId,
    summary: content,
    data: {
      type: MessageDataType.SELECTION,
      content,
      replies: [replyMsg],
    },
  }

  return message
}
export const buildQuestionMessage = (data: BuildMessageData) => {
  const {
    convId = "",
    content = "",
    questionType = QuestionType.NORMAL,
    selectedWeblinkConfig = "",
  } = data

  let dataExtra = {}
  if (questionType === QuestionType.INTENT) {
    const { intentId } = data
    dataExtra = { intentId }
  }

  const itemId = `msg:${genUniqueId()}`
  const message = {
    itemId,
    itemType: MessageItemType.QUESTION,
    convId,
    summary: content,
    data: {
      type: MessageType.Human,
      content,
      selectedWeblinkConfig,
      ...dataExtra,
    },
  }

  return message
}
export const buildReplyMessage = (data: BuildMessageData) => {
  const { convId = "", content = "", replyType = ReplyType.QUESTION } = data
  const itemId = `msg:${genUniqueId()}`

  let dataExtra = {}
  if (replyType === ReplyType.INTENT) {
    const { intentId } = data
    dataExtra = { intentId }
  } else if (replyType === ReplyType.QUESTION) {
    const { questionId } = data
    dataExtra = { questionId }
  } else if (replyType === ReplyType.WELCOME) {
    dataExtra = { suggestions: getRandomSuggestionsQuestion(3) }
  }

  const message = {
    itemId,
    convId,
    itemType: MessageItemType.REPLY,
    summary: content,
    data: {
      type: MessageType.Assistant,
      content,
      ...dataExtra,
    },
  }

  return message
}

/**
 *  生成某条消息时，还未开始生成第一个字符就被 abort
 *  1. 只用于前端展示，不保存在服务端
 *
 */
export const buildErrorMessage = (data: BuildMessageData) => {
  const { convId = "", content = errorMessage } = data

  const itemId = `error:${genUniqueId()}`

  const message = {
    itemId,
    itemType: MessageItemType.ERROR,
    convId,
    summary: content,
    data: {
      type: MessageType.Assistant,
      content,
    },
  }

  return message
}

export const buildMessage = (
  msgType: MessageItemType,
  data: BuildMessageData,
) => {
  switch (msgType) {
    case MessageItemType.INTENT:
      return buildIntentMessage(data)
    case MessageItemType.QUESTION:
      return buildQuestionMessage(data)
    case MessageItemType.REPLY:
      return buildReplyMessage(data)
  }
}

export type BuildMessageListData = {
  questionContent?: string
  selectionContent?: string
  replyContent?: string
  convId: string
}

export const buildIntentMessageList = (data: BuildMessageListData) => {
  const { convId, selectionContent, questionContent, replyContent } = data
  const intentMsg = buildIntentMessage({
    convId,
    content: selectionContent,
  })
  const intentReplyMsg = intentMsg?.data?.replies?.[0]
  const questionMsg = buildQuestionMessage({
    convId,
    content: questionContent,
  })
  const questionReplyMsg = buildReplyMessage({
    convId,
    replyType: ReplyType.QUESTION,
    questionId: questionMsg.itemId,
    content: replyContent,
  })

  return [intentMsg, intentReplyMsg, questionMsg, questionReplyMsg]
}

export const buildQuestionMessageList = (data: BuildMessageListData) => {
  const { convId, questionContent } = data

  const questionMsg = buildQuestionMessage({
    convId,
    content: questionContent,
  })
  const replyMsg = buildReplyMessage({
    convId,
    content: "",
    questionId: questionMsg?.itemId,
  })

  return [questionMsg, replyMsg]
}

export const mapToServerMessage = (messages: Message[]): ServerMessage[] => {
  const newMessages = (messages || []).map(item => {
    if (item?.data?.type === MessageType?.Human) {
      const { data, ...rest } = item
      return { ...rest, ...data }
    }

    if (item?.data?.type === MessageType.Assistant) {
      const { data, ...rest } = item
      const { sources, relatedQuestions, ...dataExtra } = data || {}
      return {
        ...rest,
        ...dataExtra,
        relatedQuestions:
          safeParseJSON(relatedQuestions) || relatedQuestions || [],
        sources: safeParseJSON(sources) || sources || [],
      }
    }
  })

  return newMessages as ServerMessage[]
}
