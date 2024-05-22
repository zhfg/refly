export interface Source {
  pageContent: string
  metadata: {
    source?: string
    title: string
    resourceId?: string
    collectionId?: string
  }
  score: number
}

export type RelatedQuestion = string

export interface SessionItem {
  question: string
  sources: Source[]
  answer: string
  relatedQuestions: RelatedQuestion[] // 推荐问题列表
}
