import type { Digest, Feed, Message, SessionItem, Source } from "@/types"
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
    relatedQuestions: answerMessage?.data.relatedQuestions || [],
  }

  console.log("buildSessionItem", session)

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

  const sessions = items.map(item => buildSessionItem(item?.[0], item?.[1]))
  return sessions
}

// 从 digest 和 feed 等 ready only aigc content 的内容构建 session
export const buildSessionsFromDigest = (aigcContent: Digest | Feed) => {
  if (!(aigcContent?.title && aigcContent?.abstract)) return []

  const session: SessionItem = {
    question: aigcContent?.title,
    answer: aigcContent?.abstract,
    sources: aigcContent?.inputs?.map(item => ({
      score: 0,
      metadata: {
        ...(safeParseJSON(item?.sources)?.[0]?.medadata || {}),
        title: item?.title,
      },
      pageContent: item?.content || "", // 这里记录单个内容的总结
    })),
    relatedQuestions: [],
  }

  console.log("buildSessionsFromAIGCContent", session)
  return [session]
}

export const buildSessionsFromFeed = (aigcContent: Digest | Feed) => {
  if (!(aigcContent?.title && aigcContent?.abstract)) return []

  const session: SessionItem = {
    question: aigcContent?.title,
    answer: aigcContent?.abstract,
    sources: safeParseJSON(aigcContent?.sources)?.map((item: any) => ({
      score: 0,
      pageContent: aigcContent?.abstract,
      metadata: item?.medadata,
    })),
    relatedQuestions: [],
  }

  console.log("buildSessionsFromAIGCContent", session)
  return [session]
}
