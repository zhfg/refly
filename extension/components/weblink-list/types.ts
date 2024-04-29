export type QueryPayload = {
  page: number
  pageSize?: number
  url?: string
  linkId?: string
}

export type IndexStatus = "init" | "processing" | "finish" | "failed"

export type WebLinkItem = {
  id: string
  linkId: string
  title: string
  description: string
  originPageTitle?: string
  originPageUrl?: string
  origin?: string
  originPageDescription?: string
  icon: string
  url: string
  userId: string
  indexStatus: IndexStatus
  createdAt: string
  updatedAt: string

  // 新增属性，用于缩短用户的路径
  summary?: string
  relatedQuestions?: string[]
}
