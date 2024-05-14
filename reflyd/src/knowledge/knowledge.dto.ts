import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';

export class WeblinkMeta {
  @ApiProperty()
  url: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  storageKey?: string;
}

export class ResourceListItem {
  @ApiProperty()
  resourceId: string;

  @ApiProperty({ enum: ResourceType })
  resourceType: ResourceType;

  @ApiProperty({ type: WeblinkMeta })
  data: WeblinkMeta;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateResourceParam {
  @ApiProperty({ enum: ResourceType })
  type: ResourceType;

  @ApiProperty()
  data: WeblinkMeta;
}

export class CreateResourceResponse {
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
}

export class CollectionListItem {
  @ApiProperty()
  collectionId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CollectionDetail extends CollectionListItem {
  @ApiProperty({ type: [ResourceListItem] })
  resources: ResourceListItem[];
}

export class CreateCollectionParam {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;
}

export class CreateCollectionResponse {
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
