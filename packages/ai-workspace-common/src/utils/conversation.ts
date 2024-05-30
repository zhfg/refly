import { Conversation } from "@/types"
import { genConvID } from "./id"

export type BuildConversation = {
  selectionContent: string
}

export const buildConversation = (
  convPayload?: Partial<Conversation>,
): Conversation => {
  const conversation: Conversation = {
    origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
    originPageTitle: document?.title || "",
    title: document?.title || "",
    originPageUrl: location.href,
    convId: genConvID(),
    locale: convPayload?.locale,
  }

  return conversation
}
