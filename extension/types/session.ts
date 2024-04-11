export interface Source {
  pageContent: string
  metadata: {
    source: string
    title: string
  }
  score: number
  xPath?: string[] // 基于此 link 进行部分内容操作
}

export type RelatedQuestion = string

export interface SessionItem {
  question: string
  sources: Source[]
  answer: string
  relatedQuestions: RelatedQuestion[] // 推荐问题列表
}
