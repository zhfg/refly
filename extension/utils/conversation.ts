import { type Conversation, type Message } from "~/types"

import { genUniqueId } from "./index"

export type BuildConversation = {
  selectionContent: string
}

export const buildConversation = (msgList?: Message[]): Conversation => {
  const conversationId = `conv:${genUniqueId()}`

  const conversation = {
    conversationId,
    items: msgList || [],
    origin: location?.href || "",
    originPageTitle: document?.title || ""
  }

  return conversation
}

// // 初始化创建对话，带欢迎
// export const buildConversationWithWelcome = () => {
//   const conversationId = `conv:${genUniqueId()}`
//   const msg = buildWelcomeMessage({ conversationId })
//   const conversation = buildConversation(conversationId, [msg])

//   return conversation
// }

// // 基于选中的意图内容直接创建一个会话
// export const buildConversationWithIntent = (data: BuildConversation) => {
//   const conversationId = `conv:${genUniqueId()}`
//   const { selectionContent = "" } = data

//   const msgList = buildIntentMessageList({
//     conversationId,
//     selectionContent
//   })
//   const conversation = buildConversation(conversationId, [...msgList])

//   return conversation
// }
