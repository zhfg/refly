export interface Source {
  pageContent: string
  metadata: {
    source?: string
    title: string
    resourceId?: string
    collectionId?: string
  }
  score: number
  selections?: Selection[] // 基于此 link 进行部分内容操作
}

export interface Selection {
  xPath: string
  content: string
  type: "text" | "table" | "link" | "image" | "video" | "audio"
}

export type RelatedQuestion = string

export interface SessionItem {
  question: string
  sources: Source[]
  answer: string
  relatedQuestions: RelatedQuestion[] // 推荐问题列表
}
