import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

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
    super.$on('query' as any, (e: any) => {
      this.logger.log(
        `query: ${e.query.slice(0, 1000)}, param: ${e.params}, duration: ${
          e.duration
        }ms`,
      );
    });
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
