import type { ClientChatMessage } from '@refly/common-types';

export const mockHumanMessage: Partial<ClientChatMessage> = {
  msgId: 'msg_122',
  type: 'human',
  content: 'txyz 是什么？最近新出的写作功能怎么样',
  pending: false,
  skillMeta: {
    displayName: '黄同学',
    icon: '👤',
  },
};

export const mockChatMessage: Partial<ClientChatMessage> = {
  msgId: 'msg_123',
  type: 'ai',
  content: '根据搜索结果和知识库内容，我为您总结如下：...',
  pending: false,
  structuredData: {
    sources: [
      // Web Search 来源
      {
        url: 'https://www.example.com/article1',
        title: 'Understanding Modern JavaScript',
        pageContent: 'JavaScript has evolved significantly over the years...',
        score: 0.89,
        metadata: {
          source: 'https://www.example.com/article1',
          title: 'Understanding Modern JavaScript',
          publishedTime: '2024-01-15',
          sourceType: 'webSearch',
          originalLocale: 'en',
          translatedDisplayLocale: 'zh-CN',
          isTranslated: true,
        },
      },
      {
        url: 'https://dev.to/article2',
        title: 'Best Practices for React Development',
        pageContent: "When building React applications, it's important to...",
        score: 0.85,
        metadata: {
          source: 'https://dev.to/article2',
          title: 'Best Practices for React Development',
          publishedTime: '2024-02-01',
          sourceType: 'webSearch',
          originalLocale: 'en',
          translatedDisplayLocale: 'zh-CN',
          isTranslated: true,
        },
      },
      // Knowledge Base 来源
      {
        url: 'http://localhost:3000/knowledge-base?resId=res_456',
        title: '项目开发规范文档',
        pageContent: '本文档规定了项目开发过程中的代码规范...',
        metadata: {
          source: 'http://localhost:3000/knowledge-base?resId=res_456',
          title: '项目开发规范文档',
          entityId: 'res_456',
          entityType: 'resource',
          sourceType: 'library',
          originalLocale: 'zh-CN',
        },
      },
      {
        url: 'http://localhost:3000/knowledge-base?noteId=note_789',
        title: '技术架构设计说明',
        pageContent: '本文档描述了系统的整体技术架构设计...',
        metadata: {
          source: 'http://localhost:3000/knowledge-base?noteId=note_789',
          title: '技术架构设计说明',
          entityId: 'note_789',
          entityType: 'canvas',
          sourceType: 'library',
          originalLocale: 'zh-CN',
          projectId: 'proj_001', // 为 canvas 类型添加 projectId
        },
      },
      // 额外的 Web Search 来源
      {
        url: 'https://medium.com/article3',
        title: 'TypeScript Best Practices 2024',
        pageContent: 'TypeScript continues to evolve with new features...',
        score: 0.82,
        metadata: {
          source: 'https://medium.com/article3',
          title: 'TypeScript Best Practices 2024',
          publishedTime: '2024-03-01',
          sourceType: 'webSearch',
          originalLocale: 'en',
          translatedDisplayLocale: 'zh-CN',
          isTranslated: true,
        },
      },
    ],
    relatedQuestions: [
      '如何在项目中实施这些开发规范？',
      '技术架构的扩展性如何保证？',
      '有哪些具体的TypeScript使用建议？',
    ],
  },
  skillMeta: {
    displayName: 'AI助手',
    icon: '🤖',
  },
  tokenUsage: [
    {
      modelName: 'GPT-4',
      inputTokens: 1250,
      outputTokens: 850,
    },
  ],
};

// Update the default messages in chat store
export const defaultExtraState = {
  messages: [mockHumanMessage, mockChatMessage] as any,
  // ... other state
};
