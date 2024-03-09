import { ApiProperty } from '@nestjs/swagger';
import { IndexStatus } from '@prisma/client';

export class WebLink {
  @ApiProperty()
  lastVisitTime: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  origin: string;

  @ApiProperty()
  originPageTitle: string;

  @ApiProperty()
  originPageUrl: string;

  @ApiProperty()
  originPageDescription: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  visitCount: number;
}

export class StoredWebLink extends WebLink {
  @ApiProperty()
  indexStatus: IndexStatus;
}

export class StoreWebLinkParam {
  @ApiProperty({ type: [WebLink] })
  data: WebLink[];
}

export class GetWebLinkListResponse {
  @ApiProperty({ type: [StoredWebLink] })
  data: StoredWebLink[];
}
