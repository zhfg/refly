import { type Conversation } from "./conversation";

export interface Mode {
  id: string;
  icon: any;
  text: string;
  prompt: string;
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

export const enum ACTION_TYPE {
  SELECTION = "selection",
}

export type GEN_TITLE = {
  conversationId: string;
};

export type QUICK_ACTION = {
  actionType?: ACTION_TYPE;
  actionPrompt?: string;
  reference?: string;
};

export type SEARCH_RESULT_ITEM = {
  title: string;
  url: string;
  desc: string;
};

export type SEARCH_ENHANCE = {
  keyword: string;
  items: SEARCH_RESULT_ITEM[];
  isManual: boolean;
};

export type Task = {
  taskType: TASK_TYPE;
  taskId: string; // task:xxxx-xxxx-xxxx-xxxx
  language: LANGUAGE;
  locale: LOCALE;
  data: Partial<Conversation> | GEN_TITLE | QUICK_ACTION | SEARCH_ENHANCE;
};

//如何把TASK_TYPE和data关联起来
