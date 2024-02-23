import {
  LANGUAGE,
  LOCALE,
  TASK_TYPE,
  type Conversation,
  type QUICK_ACTION,
  type SEARCH_ENHANCE,
  type Task
} from "~/types"

import { genUniqueId } from "./index"

export type BuildTask = {
  taskType: TASK_TYPE
  language?: LANGUAGE
  locale?: LOCALE
  data: Partial<Conversation> | QUICK_ACTION | SEARCH_ENHANCE
}

export const buildTask = (payload: BuildTask): Task => {
  const {
    taskType,
    language = LANGUAGE.AUTO,
    locale = LOCALE.ZH_CN,
    data = {}
  } = payload
  const taskId = `task:${genUniqueId()}`

  const task: Task = {
    taskType,
    taskId,
    language,
    locale,
    data: data
  }

  return task
}
