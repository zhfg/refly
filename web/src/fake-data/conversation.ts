import { MessageType } from "@/types"
import { fakeTermsMdText } from "./markdown"

export const fakeConversations = [
  {
    id: 1,
    convId: "cv-pp2h4258rzuzw5w8moa3iq84",
    userId: 1,
    contentId: null,
    title: "Refly | 会话库",
    lastMessage: "",
    messageCount: 0,
    origin: "http://localhost:5173",
    originPageUrl: "http://localhost:5173/",
    originPageTitle: "Refly | 会话库",
    createdAt: "2024-05-15T09:24:50.691Z",
    updatedAt: "2024-05-15T09:24:50.691Z",
    messages: [
      {
        id: "1",
        type: MessageType.Human,
        content: "解释内容解释内容解释内容解释内容解释内容",
      },
      {
        id: "2",
        type: MessageType.Assistant,
        content: fakeTermsMdText?.slice(120, 400),
      },
      {
        id: "3",
        type: MessageType.Human,
        content: "解释内容",
      },
      {
        id: "4",
        type: MessageType.Assistant,
        content: fakeTermsMdText?.slice(120, 400),
      },
      {
        id: "3",
        type: MessageType.Human,
        content: "解释内容",
      },
      {
        id: "4",
        type: MessageType.Assistant,
        content: fakeTermsMdText?.slice(120, 400),
      },
      {
        id: "3",
        type: MessageType.Human,
        content: "解释内容",
      },
      {
        id: "4",
        type: MessageType.Assistant,
        content: fakeTermsMdText?.slice(120, 400),
      },
      {
        id: "3",
        type: MessageType.Human,
        content: "解释内容",
      },
      {
        id: "4",
        type: MessageType.Assistant,
        content: fakeTermsMdText?.slice(0, 400),
      },
    ],
  },
]
