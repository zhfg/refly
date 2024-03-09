export interface Source {
  pageContent: string
  metadata: {
    source: string
    title: string
  }
  score: number
}

export interface SessionItem {
  question: string
  sources: Source[]
  answer: string
  relatedQuestions: string[] // 推荐问题列表
}
