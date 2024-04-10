export interface Mark {
  type: "text" | "table" | "link" | "image" | "video" | "audio" // 内容类型
  data: string[]
  target: HTMLElement
  xPath: string // 该元素对应的 DOM Xpath 路径，这个可以当做唯一 id
}

export interface Source {
  pageContent: string
  metadata: {
    source: string
    title: string
  }
  score: number
}

export interface Data {
  version: string // 浏览器插件所属的版本，方便制定兼容策略
  type: "partial-content" | "whole-content" | "link" // 是前端全部内容、部分内容、还是直接通过 link 处理
  source: Source // 网页 Meta
  marks: Mark[]
  userId: string // 是否需要 by User 保存，到时候可以推荐给其他人是这个人的策略
}
