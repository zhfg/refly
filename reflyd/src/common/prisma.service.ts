import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from './logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private logger: LoggerService) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });

    this.logger.setContext(PrismaService.name);
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
