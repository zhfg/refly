export interface CollectionListItem {
  collectionId: string
  title: string
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
}

export interface ResourceListItem {
  resourceId?: string
  resourceType: ResourceType
  data?: WeblinkMeta
  collectionName?: string
  isPublic?: boolean
  createdAt?: string
  updatedAt?: string
  userId?: number
}

export interface ResourceDetail extends ResourceListItem {
  doc?: string
}

export interface CollectionDetail extends CollectionListItem {
  resources?: ResourceListItem[]
}
