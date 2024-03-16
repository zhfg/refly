import type { Source } from "./session"

export interface Mode {
  id: string
  icon: any
  text: string
  prompt: string
}

export const enum TASK_STATUS {
  // 前端 task
  START = "start",
  SHUTDOWN = "shutdown",
}

export const enum TASK_TYPE {
  // 和服务端调通的 task
  CHAT = "chat",
  GEN_TITLE = "genTitle",
  QUICK_ACTION = "quickAction",
  SEARCH_ENHANCE_KEYWORD = "searchEnhanceKeyword",
  SEARCH_ENHANCE_SUMMARIZE = "searchEnhanceSummarize",
  SEARCH_ENHANCE_ASK = "searchEnhanceAsk",
}

export const enum LANGUAGE {
  AUTO = "auto",
}

export const enum LOCALE {
  ZH_CN = "zh_CN",
}

export const enum QUICK_ACTION_TYPE {
  SELECTION = "selection",
  SUMMARY = "summary", // 用作总结内容
}

export type GEN_TITLE = {
  conversationId: string
}

export type QUICK_ACTION_TASK_PAYLOAD = {
  question?: string // 用户问题

  actionType?: QUICK_ACTION_TYPE
  actionPrompt?: string
  reference?: string
  conversationId?: string
  filter?: {
    // 限制用于 quick-action 的网页列表
    weblinkList?: Source[]
  }
}

export type SEARCH_RESULT_ITEM = {
  title: string
  url: string
  desc: string
}

export type SEARCH_ENHANCE = {
  keyword: string
  items: SEARCH_RESULT_ITEM[]
  isManual: boolean
}

export type CHAT = {
  question: string
  conversationId?: string
  filter?: {
    // 限制召回网页的 filter
    weblinkList?: Source[]
  }
}

export type Task = {
  taskType: TASK_TYPE
  taskId?: string // task:xxxx-xxxx-xxxx-xxxx
  language?: LANGUAGE
  locale?: LOCALE
  data?: CHAT | QUICK_ACTION_TASK_PAYLOAD
}

//如何把TASK_TYPE和data关联起来
