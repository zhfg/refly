export const appConfig = {
  currentPage: {},
  operation: {},
  side: {
    Right: "right",
    Left: "left",
  },
  url: {
    // 先临时写在这里，后续会替换
    deleteConversation: "/api/conversation/deleteConversation",
    updateConversation: "/api/conversation/updateConversation",
    getChatItemList: "/api/chat/getChatItemList",
    generateAnswer: "/api/generate/gen",
    generateTitle: "/api/generate/gen-title",
    syncChatItems: "/api/task/syncChatItems",
    createNewConversation: "/v1/conversation/new",
    getThreadMessages: (threadId: string) => `/v1/conversation/${threadId}`,
    storeWeblink: "/v1/weblink/store",
    getWeblinkList: "/v1/weblink/list",
    getWeblinkIndexStatus: "/v1/weblink/list", // 与 weblink 共享
    getConversationList: "/v1/conversation/list",
    getUserInfo: "/v1/auth/getUserInfo",
  },
  domId: {},
  appInfo: {
    WebUrl: "webUrl",
    ShowedPauseTip: "showedPauseTip",
    HighlighterColor: "highlighterColor",
    LastViewedAnnouncement: "lastViewedAnnouncement",
    IsDeveloper: "isDeveloper",
  },
  uiInfo: {},
  errInfo: [
    "Error: This request exceeds the MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota.",
    "The message port closed before a response was received.",
    "Could not establish connection. Receiving end does not exist.",
    "Extension context invalidated.",
    "The browser is shutting down.",
    "ResizeObserver loop limit exceeded",
    "Cannot access contents of the page.",
    "No tab with id:",
  ],
}

export type REQUEST_URL_TYPE = keyof typeof appConfig.url
