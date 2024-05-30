import type { Message, SessionItem } from "~types"
import { safeParseJSON } from "./parse"

export const buildSessionItem = (
  questionMsg: Message,
  answerMessage: Message,
) => {
  // 有可能 answer message 还未构建，所以要考虑兜底情况
  const session: SessionItem = {
    question: questionMsg?.data.content || "",
    answer: answerMessage?.data.content || "",
    sources:
      safeParseJSON(answerMessage?.data.sources) ||
      answerMessage?.data.sources ||
      [],
    relatedQuestions:
      safeParseJSON(answerMessage?.data.relatedQuestions) ||
      answerMessage?.data.relatedQuestions ||
      [],
  }

  return session
}

export const buildSessions = (messages: Message[]) => {
  const items = []

  for (let i = 0; i < messages.length; i += 2) {
    if (i + 1 < messages.length) {
      items.push([messages[i], messages[i + 1]])
    } else {
      items.push([messages[i]])
    }
  }

  const sessions = items.map((item) => buildSessionItem(item?.[0], item?.[1]))
  return sessions
}
