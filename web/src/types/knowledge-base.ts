export interface CollectionListItem {
  collectionId: string
  title: string
  name?: string
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  userId?: number
}

export enum ResourceType {
  weblink = "weblink",
}

export interface WeblinkMeta {
  url: string
  linkId?: string
  title?: string
  storageKey?: string
  parsedDocStorageKey?: string
  keywords?: string[]
}

export interface ResourceListItem {
  resourceId?: string
  resourceType: ResourceType
  data?: WeblinkMeta
  collectionName?: string
  collectionId?: string
  isPublic?: boolean
  createdAt?: string
  updatedAt?: string
  userId?: number
  title?: string
  description?: string
}

export enum ResourceIndexStatus {
  init = "init",
  processing = "processing",
  finish = "finish",
  failed = "failed",
}

export interface ResourceDetail extends ResourceListItem {
  doc?: string
  wordCount?: number
  indexStatus?: ResourceIndexStatus
}

export interface CollectionDetail extends CollectionListItem {
  resources?: ResourceListItem[]
}
