import type { Message } from "~types"

export const fakeRetrievalDocs = [
  {
    pageContent:
      '说明\n使用 chrome.history API 与浏览器的访问过网页记录进行交互。您可以在浏览器的历史记录中添加、移除和查询网址。要使用您自己的版本覆盖历史记录页面，请参阅覆盖网页。\n\n权限\nhistory\n\n\n\n如需与用户的浏览器历史记录进行交互，请使用 History API。\n\n\n\n如需使用 History API，请在扩展程序清单中声明 "history" 权限。例如：\n{\n  "name": "My extension",\n  ...\n  "permissions": [\n    "history"\n  ],\n  ...\n}\n\n概念和用法\n\n过渡类型\n\nHistory API 使用转场类型来描述浏览器如何在特定访问中导航到特定网址。例如，如果用户通过点击其他页面上的链接来访问某个页面，则转换类型为“链接”。如需查看过渡类型的列表，请参阅参考内容。\n\n示例\n\n如需试用此 API，请从 chrome-extension-samples 代码库安装历史记录 API 示例。\n\n类型\n  \n    \n      HistoryItem\n    用于封装历史记录查询结果的对象。\n属性\n    \n      id\n      string\n    商品的唯一标识符。\n\n    \n      lastVisitTime\n      数字可选\n    此网页的上次加载时间，以自纪元起经过的毫秒数表示。\n\n    \n      title\n      字符串（可选）\n    上次加载网页时的网页标题。\n\n    \n      typedCount\n      数字可选\n    用户通过输入地址导航到此页面的次数。\n\n    \n      网址\n      字符串（可选）\n    用户已导航到的网址。\n\n    \n      visitCount\n      数字可选\n    用户导航到此网页的次数。',
    metadata: {
      source:
        "https://developer.chrome.com/docs/extensions/reference/api/history?hl=zh-cn#method-search",
      loc: {
        lines: {
          from: 2177,
          to: 2243,
        },
      },
    },
  },
  {
    pageContent:
      "此页面由 Cloud Translation API 翻译。\n          \n        \n        \n      \n    \n  \n\n  \n    \n    \n    \n  \n  \n    \n    \n    \n      \n  \n    \n        首页\n      \n  \n  \n    \n  \n  \n  \n    \n      \n      \n    \n    \n    \n      \n  \n    \n        Docs\n      \n  \n  \n    \n  \n  \n  \n    \n      \n      \n    \n    \n    \n      \n  \n    \n        Extensions\n      \n  \n  \n    \n  \n  \n  \n    \n      \n      \n    \n    \n    \n      \n  \n    \n        Reference\n      \n  \n  \n    \n  \n  \n  \n    \n      \n      \n    \n    \n    \n      \n  \n    \n        API\n      \n  \n  \n    \n  \n  \n\n    \n      \n    \n    \n  \n    \n  \n  \n      chrome.history\n  \n\n        \n        \n\n        \n          \n          使用集合让一切井井有条\n        \n        \n          \n          根据您的偏好保存内容并对其进行分类。",
    metadata: {
      source:
        "https://developer.chrome.com/docs/extensions/reference/api/history?hl=zh-cn#method-search",
      loc: {
        lines: {
          from: 2030,
          to: 2146,
        },
      },
    },
  },
  {
    pageContent:
      "已删除\n      对象\n    \n    \n      allHistory\n      boolean\n    如果所有历史记录均已移除，则为“true”。如果为 true，网址将为空。\n\n    \n      urls\n      string[] 可选\n    \n    \n    \n    \n\n\n  \n  \n\n  \n\n\n  \n\n  \n    \n    \n      \n    \n    \n  \n       \n    \n    \n  \n\n  \n  \n\n\n\n\n  如未另行说明，那么本页面中的内容已根据知识共享署名 4.0 许可获得了许可，并且代码示例已根据 Apache 2.0 许可获得了许可。有关详情，请参阅 Google 开发者网站政策。Java 是 Oracle 和/或其关联公司的注册商标。\n  最后更新时间 (UTC)：2024-02-23。",
    metadata: {
      source:
        "https://developer.chrome.com/docs/extensions/reference/api/history?hl=zh-cn#method-search",
      loc: {
        lines: {
          from: 2569,
          to: 2613,
        },
      },
    },
  },
  {
    pageContent:
      "概览\n  \n    \n  \n  \n          \n        \n      \n        \n          \n            \n    \n    开始使用\n  \n    \n  \n  \n          \n        \n      \n        \n          \n            \n    \n    开发\n  \n    \n  \n  \n          \n        \n      \n        \n          \n            \n    \n    方法指南\n  \n    \n  \n  \n          \n        \n      \n        \n          \n  \n    \n    参考资料\n  \n    \n  \n  \n    \n  \n  \n    \n    \n      \n        \n          \n            \n              \n              \n              \n                \n                  \n                    \n                    \n                      API\n                    \n                    \n                  \n                \n              \n                \n                  \n                    \n                    \n                      权限",
    metadata: {
      source:
        "https://developer.chrome.com/docs/extensions/reference/api/history?hl=zh-cn#method-search",
      loc: {
        lines: {
          from: 645,
          to: 724,
        },
      },
    },
  },
]

export const fakeMessages = [
  {
    itemId: "msg:4e5fb7a580ad24f8ddf0cfcd8b93cddb",
    itemType: "question",
    conversationId: "conv:b03cb1669896628aac3ef97d2a5eb1b2",
    summary: "agent 是什么？",
    data: {
      type: "text",
      content: "agent 是什么？",
    },
  },
  {
    itemId: "msg:1702b1adf87e99835da58c6fd7a3ca9d",
    conversationId: "conv:b03cb1669896628aac3ef97d2a5eb1b2",
    itemType: "reply",
    summary: "",
    data: {
      type: "text",
      content:
        "Agent 是指一种程序或系统，可以自主执行特定任务或代表用户执行任务的实体。在这种情境下，agent 是指一个由 LLM 控制的虚拟角色，可以在模拟环境中执行各种任务和与其他 agent 互动。",
      questionId: "msg:4e5fb7a580ad24f8ddf0cfcd8b93cddb",
      sources: fakeRetrievalDocs,
    },
  },
  {
    itemId: "msg:4e5fb7a580ad24f8ddf0cfcd8b93cddb",
    itemType: "question",
    conversationId: "conv:b03cb1669896628aac3ef97d2a5eb1b2",
    summary: "agent 是什么？",
    data: {
      type: "text",
      content: "agent 是什么？",
    },
  },
  {
    itemId: "msg:1702b1adf87e99835da58c6fd7a3ca9d",
    conversationId: "conv:b03cb1669896628aac3ef97d2a5eb1b2",
    itemType: "reply",
    summary: "",
    data: {
      type: "text",
      content:
        "Agent 是指一种程序或系统，可以自主执行特定任务或代表用户执行任务的实体。在这种情境下，agent 是指一个由 LLM 控制的虚拟角色，可以在模拟环境中执行各种任务和与其他 agent 互动。",
      questionId: "msg:4e5fb7a580ad24f8ddf0cfcd8b93cddb",
      sources: fakeRetrievalDocs,
    },
  },
]
