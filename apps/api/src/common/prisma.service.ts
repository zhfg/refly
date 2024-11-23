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
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');

    this.$on('query' as never, (e: any) => {
      if (process.env.NODE_ENV === 'production') {
        this.logger.log(`query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`);
      }
    });
  }
}
