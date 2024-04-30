import { Thread } from "@/types"

export type BuildConversation = {
  selectionContent: string
}

export const buildConversation = (): Partial<Thread> => {
  const conversation = {
    origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
    originPageTitle: document?.title || "",
    title: document?.title || "",
    originPageUrl: location.href,
  }

  return conversation
}
