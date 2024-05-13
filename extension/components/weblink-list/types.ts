export type QueryPayload = {
  page: number
  pageSize?: number
  url?: string
  linkId?: string
}

export type IndexStatus = "init" | "processing" | "finish" | "failed"
export enum ParseSource {
  serverCrawl = "serverCrawl",
  clientUpload = "clientUpload",
}

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
  createdAt: string
  updatedAt: string

  // 新增属性，用于缩短用户的路径

  summary?: string
  relatedQuestions?: string[]
  // indexStatus: IndexStatus
  parseStatus?: IndexStatus // 标识处理状态：1）finish 标识支持服务端抓取和解析完成 2）failed 标识不支持服务端抓取和解析
  chunkStatus?: IndexStatus // 当前不使用
  parseSource?: ParseSource
}
