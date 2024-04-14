import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from './logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private logger: LoggerService) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool, { schema: 'refly' });

    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
      adapter,
    });
  }

  async onModuleInit() {
    this.$on('query' as never, (e: any) => {
      this.logger.log(
        `query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`,
      );
    });
    await this.$connect();
    this.logger.log('Connected to database');
  }
}
