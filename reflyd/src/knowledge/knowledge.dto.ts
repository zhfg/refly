import _ from 'lodash';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Resource, ResourceType } from '@prisma/client';

export class WeblinkMeta {
  @ApiProperty()
  url: string;

  @ApiProperty()
  linkId?: string;

  @ApiProperty()
  title?: string;

  @ApiPropertyOptional()
  storageKey?: string;

  @ApiPropertyOptional()
  parsedDocStorageKey?: string;
}

export class ResourceListItem {
  @ApiProperty()
  resourceId: string;

  @ApiProperty({ enum: ResourceType })
  resourceType: ResourceType;

  @ApiPropertyOptional({ type: WeblinkMeta })
  data?: WeblinkMeta;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  userId?: number;
}

export class ResourceDetail extends ResourceListItem {
  @ApiPropertyOptional()
  doc?: string;
}

export class GetResourceDetailResponse {
  @ApiProperty({ type: ResourceDetail })
  data: ResourceDetail;
}

export class UpsertResourceRequest {
  @ApiProperty({ enum: ResourceType })
  resourceType: ResourceType;

  @ApiPropertyOptional()
  collectionId?: string; // if empty, create new collection

  @ApiPropertyOptional()
  collectionName?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  data: WeblinkMeta;

  @ApiPropertyOptional()
  resourceId?: string; // only used for update

  @ApiPropertyOptional()
  isPublic?: boolean;
}

export class UpsertResourceResponse {
  @ApiProperty({ type: ResourceListItem })
  data: ResourceListItem;
}

export class ListResourceResponse {
  @ApiProperty({ type: [ResourceListItem] })
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
  @ApiProperty()
  collectionId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  userId?: number; // only used for authorization check
}

export class CollectionDetail extends CollectionListItem {
  @ApiProperty({ type: [ResourceListItem] })
  resources: ResourceListItem[];
}

export class UpsertCollectionRequest {
  @ApiProperty()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  collectionId?: string; // used for update

  @ApiPropertyOptional()
  isPublic?: boolean;
}

export class UpsertCollectionResponse {
  @ApiProperty({ type: CollectionListItem })
  data: CollectionListItem;
}

export class ListCollectionResponse {
  @ApiProperty({ type: [CollectionListItem] })
  data: CollectionListItem[];
}

export class GetCollectionDetailResponse {
  @ApiProperty({ type: CollectionDetail })
  data: CollectionDetail;
}

export class DeleteCollectionRequest {
  @ApiProperty()
  collectionId: string;
}

export const convertResourcePoToListItem = (resource: Resource): ResourceListItem => {
  return _.omit(resource, ['id', 'userId', 'deletedAt']);
};
