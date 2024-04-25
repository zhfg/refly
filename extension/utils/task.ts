import {
  LANGUAGE,
  LOCALE,
  TASK_TYPE,
  type Conversation,
  type QUICK_ACTION_TASK_PAYLOAD,
  type SEARCH_ENHANCE,
  type Task,
  type GEN_TITLE,
  type CHAT,
} from "~/types"

import { genUniqueId } from "./index"
import type { OutputLocale } from "./i18n"

export type BuildTask = {
  taskType: TASK_TYPE
  language?: LANGUAGE
  locale?: OutputLocale
  data: CHAT | QUICK_ACTION_TASK_PAYLOAD
}

export const buildTask = (payload: BuildTask): Task => {
  const { taskType, language = LANGUAGE.AUTO, locale, data = {} } = payload
  const taskId = `task:${genUniqueId()}`

  const task: Task = {
    taskType,
    taskId,
    language,
    locale,
    data: data,
  }

  return task
}

export const buildChatTask = (data, locale: OutputLocale = LOCALE.EN): Task => {
  const task: Task = {
    taskType: TASK_TYPE.CHAT,
    language: LANGUAGE.AUTO,
    locale,
    data,
  }

  return task
}

export const buildQuickActionTask = (
  data,
  locale: OutputLocale = LOCALE.EN,
): Task => {
  const task: Task = {
    taskType: TASK_TYPE.QUICK_ACTION,
    language: LANGUAGE.AUTO,
    locale,
    data,
  }

  return task
}
