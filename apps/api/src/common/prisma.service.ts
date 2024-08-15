import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });

    this.$on('query' as never, (e: any) => {
      this.logger.log(`query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }
}
