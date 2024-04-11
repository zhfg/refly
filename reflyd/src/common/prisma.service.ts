import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new Pool({
      connectionString: `postgresql://refly:test@localhost:5432/refly?schema=refly`,
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
