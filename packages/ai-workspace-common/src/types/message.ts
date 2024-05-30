import type { RelatedQuestion, Source } from "./session"
import { TASK_TYPE } from "./task"

// export const enum MessageType {
//   "Example" = "Example",
//   "System" = "System",
//   "User" = "User",
//   "UnSupported" = "UnSupported",
// }
// export const enum QuestionType {
//   "QuickAction" = "QuickAction",
//   "NormalQuestion" = "NormalQuestion"
// }

export type MessageState = {
  taskType?: TASK_TYPE
  pendingMsg?: string
  pendingFirstToken?: boolean // 是否正在准备生成，如果收到第一个字符，即代表已经开始生生成
  pending?: boolean
  error?: boolean // 此次信息是否出错，比如还没开始生成就 abort，显示错误信息
  pendingReplyMsg?: Message | null // 即将生成的 replyMsg 对象
  history?: [string, string][]
  pendingSourceDocs?: Source[]
  pendingRelatedQuestions?: RelatedQuestion[]
}

/**
 * 前端系统配置，可能是获取的在线配置
 */
export const enum SystemMessageType {
  RECOMMEND_QUESTION = "recommendQuestion", // 比如提示的三个问题 1. 用简单的语言解释复杂的概念、集思广益前所未有的想法、立即获得朗朗上口的标题 等
  RECOMMEND_OPERATION = "recommendOperation", // 推荐的操作，比如推荐好友、去 Chrome 商店给五星好评、发推特
}

/**
 *  聊天消息相关
 */

export const enum MessageItemType {
  REPLY = "reply",
  INTENT = "intent",
  QUESTION = "question",

  // 状态消息
  ERROR = "error",
}

export const enum MessageDataType {
  SELECTION = "selection",
  TEXT = "text",
}

export const enum ReplyType {
  WELCOME = "welcome", // 初始新会话的欢迎回复
  QUESTION = "question", // 对某个问题的回复
  INTENT = "intent", // 对某段选中意图的文本进行回复
}

export const enum QuestionType {
  INTENT = "intent", // 基于某段选中意图进行提问
  NORMAL = "normal", // 正常提问
}

/**
 * 不会生成会话保存的场景：
 * 1. 如果用户只进行 quickAction，不点继续聊天，那么不会生成会话保存
 * 2. 如果用户新建会话，不继续聊天，不会生产会话保存
 * 3.
 */
// export interface Message {
//   type: MessageType
//   text?: string
//   title?: string
//   question?: string
// }

export const enum MessageType {
  Human = "human",
  Assistant = "ai",
  System = "system",
}

export type Message = {
  id?: string // 服务端存消息
  itemType: MessageItemType
  type?: MessageType
  itemId: string // 针对 question 和 reply 为 msg:xxxx-xxxx-xxxx-xxxx，针对 intent 为 intent:xxxx-xxxx-xxxx-xxxx
  userId?: string
  convId: string
  summary?: string
  seq?: number
  data: Partial<{
    type: MessageType
    content: string
    suggestions?: { text: string }[] // 对话开始提示的 3 个问题
    relatedQuestions?: RelatedQuestion[] // 对话回答完之后，生成的相关问题推荐
    sources?: Source[]
    questionId?: string // 对问题进行的回答，都会有 questionId，如果不是基于某个问题的回答，如自动生成的，则为 null
    replies?: Message[] // 基于 selection，自动生成一个的 system 回答，eg：您希望对文本进行什么操作？
    intentId?: string // 基于某个意图进行提问回答，有三个。选中的内容、系统推荐提问、用户进行回答
    selectedWeblinkConfig?: string // 每次提问完在 human message 上加一个提问的 filter，这样之后追问时可以 follow 这个 filter 规则
  }>
}

export type ServerMessage = {
  id?: string // 服务端存消息
  itemType: MessageItemType
  type?: MessageType
  itemId: string // 针对 question 和 reply 为 msg:xxxx-xxxx-xxxx-xxxx，针对 intent 为 intent:xxxx-xxxx-xxxx-xxxx
  userId?: string
  convId: string
  summary?: string
  seq?: number
  content: string
  suggestions?: { text: string }[] // 对话开始提示的 3 个问题
  relatedQuestions?: string[] // 对话回答完之后，生成的相关问题推荐
  sources?: Source[]
  questionId?: string // 对问题进行的回答，都会有 questionId，如果不是基于某个问题的回答，如自动生成的，则为 null
  replies?: Message[] // 基于 selection，自动生成一个的 system 回答，eg：您希望对文本进行什么操作？
  intentId?: string // 基于某个意图进行提问回答，有三个。选中的内容、系统推荐提问、用户进行回答
  selectedWeblinkConfig?: string // 每次提问完在 human message 上加一个提问的 filter，这样之后追问时可以 follow 这个 filter 规则
}
