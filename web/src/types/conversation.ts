import type { Message } from "./message"

export type Conversation = {
  id?: string
  convId: string
  items?: Message[]
  origin: string
  originPageTitle: string
  preGeneratedReplyId?: string
  lastMessage?: string
  title?: string
  createdAt?: string | number
  updatedAt?: string | number

  // 为阅读文章，阅读增强做的设计，后续添加
  readEnhanceIndexStatus?: any
  readEnhanceArticle?: any
}

export const enum ConversationOperation {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}
