import { ReportEventData } from '@/event/event.dto';
import { CHANNEL_REPORT_EVENT, QUEUE_EVENT } from '@/utils';
import { getQueueToken } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit, Provider } from '@nestjs/common';
import { Collection, Prisma, PrismaClient } from '@prisma/client';
import { Queue } from 'bull';

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
    // this.$on('query' as never, (e: any) => {
    //   this.logger.log(`query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`);
    // });
    await this.$connect();
    this.logger.log('Connected to database');
  }
}

const registerClientExtensions = (client: PrismaClient, queue: Queue<ReportEventData>) => {
  const sendCollectionCreateEvent = async (coll: Pick<Collection, 'uid' | 'collectionId'>) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: coll.uid,
        eventType: 'create',
        entityType: 'collection',
        entityId: coll.collectionId,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  const sendCollectionUpdateEvent = async (coll: {
    uid: string | Prisma.StringFieldUpdateOperationsInput;
    collectionId: string | Prisma.StringFieldUpdateOperationsInput;
  }) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: typeof coll.uid === 'string' ? coll.uid : coll.uid.set,
        eventType: 'create',
        entityType: 'collection',
        entityId: typeof coll.collectionId === 'string' ? coll.collectionId : coll.collectionId.set,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  return client.$extends({
    query: {
      collection: {
        async create({ args, query }) {
          const res = await query(args);
          await sendCollectionCreateEvent(args.data);
          return res;
        },
        async createMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendCollectionCreateEvent(d)));
          } else {
            await sendCollectionCreateEvent(args.data);
          }
          return res;
        },
        async createManyAndReturn({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendCollectionCreateEvent(d)));
          } else {
            await sendCollectionCreateEvent(args.data);
          }
          return res;
        },
        async update({ args, query }) {
          const res = await query(args);
          const { uid, collectionId } = res;
          await sendCollectionUpdateEvent({ uid, collectionId });
          return res;
        },
        async updateMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendCollectionUpdateEvent(d)));
          } else {
            await sendCollectionUpdateEvent({
              uid: args.data.uid,
              collectionId: args.data.collectionId,
            });
          }
          return res;
        },
        async upsert({ args, query }) {
          args.create.createdAt = new Date();
          const res = await query(args);

          if (new Date(res['createdAt'] as string).getTime() === args.create.createdAt.getTime()) {
            await sendCollectionCreateEvent(args.create);
          } else if (Object.keys(args.update).length > 0) {
            const { uid, collectionId } = res;
            await sendCollectionUpdateEvent({ uid, collectionId });
          }

          return res;
        },
      },
    },
  });
};

export const PrismaProvider: Provider = {
  provide: PrismaService,
  useFactory: (queue: Queue<ReportEventData>) => {
    return registerClientExtensions(new PrismaService(), queue);
  },
  inject: [getQueueToken(QUEUE_EVENT)],
};
