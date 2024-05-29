export enum ResourceType {
  'weblink',
}

export class WeblinkMeta {
  url: string;
  linkId?: string;
  title?: string;
  storageKey?: string;
}

export class ResourceListItem {
  resourceId: string;
  resourceType: ResourceType;
  data?: WeblinkMeta;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: number;
}

export class ResourceDetail extends ResourceListItem {
  doc?: string;
}

export class GetResourceDetailResponse {
  data: ResourceDetail;
}

export type ResourceMeta = WeblinkMeta;

export class UpsertResourceRequest {
  resourceType: ResourceType;
  collectionId?: string; // if empty, create new collection
  collectionName?: string;
  title: string;
  storageKey?: string; // if empty, will perform server crawl
  data: ResourceMeta;
  content?: string; // NOTE: this will be ignored if storageKey is set
  resourceId?: string; // only used for update
  isPublic?: boolean;
  userId?: number; // internal use only
}

export class UpsertResourceResponse {
  data: ResourceListItem;
}

export class ListResourceResponse {
  data: ResourceListItem[];
}

export class QueryResourceParam {
  resourceId?: string;
  collectionId?: string;
  page?: number;
  pageSize?: number;
}

export class DeleteResourceRequest {
  resourceId: string;
}

export class CollectionListItem {
  collectionId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: number; // only used for authorization check
}

export class CollectionDetail extends CollectionListItem {
  resources: ResourceListItem[];
}

export class UpsertCollectionRequest {
  title?: string;
  description?: string;
  collectionId?: string; // used for update
  isPublic?: boolean;
}

export class UpsertCollectionResponse {
  data: CollectionListItem;
}

export class ListCollectionResponse {
  data: CollectionListItem[];
}

export class GetCollectionDetailResponse {
  data: CollectionDetail;
}

export class DeleteCollectionRequest {
  collectionId: string;
}
