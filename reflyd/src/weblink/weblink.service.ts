import { Injectable, Logger } from '@nestjs/common';
import { IndexStatus, Prisma } from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { PrismaService } from '../prisma.service';
import { WebLink } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class WeblinkService {
  private readonly logger = new Logger(WeblinkService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('index') private indexQueue: Queue,
  ) {}

  async storeLinks(links: WebLink[]) {
    const docs = links.map((link) => ({
      origin: link.origin,
      originPageTitle: link.originPageTitle,
      originPageUrl: link.originPageUrl,
      originPageDescription: link.originPageDescription,
      url: link.url,
      linkId: randomUUID(),
      userId: '5c0a7922c9d89830f4911426',
      indexStatus: 'init' as IndexStatus,
    }));
    const batch = await this.prisma.weblink.createMany({
      data: docs,
    });
    this.logger.log(`total of ${batch.count} links created`);

    return Promise.all(
      docs.map((doc) => this.indexQueue.add('indexWebLink', doc)),
    );
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.WeblinkWhereUniqueInput;
    where?: Prisma.WeblinkWhereInput;
    orderBy?: Prisma.WeblinkOrderByWithRelationInput;
  }) {
    return this.prisma.weblink.findMany(params);
  }
}
