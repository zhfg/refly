import { type Conversation, type Message } from "@/src/types";

import { genUniqueId } from "./index";
import { createId } from "@paralleldrive/cuid2";

export type BuildConversation = {
  selectionContent: string;
};

export const buildConversation = (
  msgList?: Message[]
): Partial<Conversation> => {
  const conversation = {
    origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
    originPageTitle: document?.title || "",
    title: document?.title || "",
    originPageUrl: location.href,
    convId: createId(), // 前端生成和带上 convId
  };

  return conversation;
};
