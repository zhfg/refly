import { ReportEventData } from '@/event/event.dto';
import { CHANNEL_REPORT_EVENT, QUEUE_EVENT } from '@/utils';
import { getQueueToken } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit, Provider } from '@nestjs/common';
import { Collection, Note, Prisma, PrismaClient, Resource } from '@prisma/client';
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
    this.$on('query' as never, (e: any) => {
      this.logger.log(`query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`);
    });
    await this.$connect();
    this.logger.log('Connected to database');
  }
}

/**
 * Register Prisma client extensions for reporting entity change events.
 * Refer to https://www.prisma.io/docs/orm/prisma-client/client-extensions/query.
 */
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
        eventType: 'update',
        entityType: 'collection',
        entityId: typeof coll.collectionId === 'string' ? coll.collectionId : coll.collectionId.set,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  const sendResourceCreateEvent = async (resource: Pick<Resource, 'uid' | 'resourceId'>) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: resource.uid,
        eventType: 'create',
        entityType: 'resource',
        entityId: resource.resourceId,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  const sendResourceUpdateEvent = async (resource: {
    uid: string | Prisma.StringFieldUpdateOperationsInput;
    resourceId: string | Prisma.StringFieldUpdateOperationsInput;
  }) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: typeof resource.uid === 'string' ? resource.uid : resource.uid.set,
        eventType: 'update',
        entityType: 'resource',
        entityId:
          typeof resource.resourceId === 'string' ? resource.resourceId : resource.resourceId.set,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  const sendNoteCreateEvent = async (note: Pick<Note, 'uid' | 'noteId'>) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: note.uid,
        eventType: 'create',
        entityType: 'note',
        entityId: note.noteId,
      });
    } catch (e) {
      console.error(e); // TODO: use service logger (but how?)
    }
  };

  const sendNoteUpdateEvent = async (note: {
    uid: string | Prisma.StringFieldUpdateOperationsInput;
    noteId: string | Prisma.StringFieldUpdateOperationsInput;
  }) => {
    try {
      await queue.add(CHANNEL_REPORT_EVENT, {
        uid: typeof note.uid === 'string' ? note.uid : note.uid.set,
        eventType: 'update',
        entityType: 'resource',
        entityId: typeof note.noteId === 'string' ? note.noteId : note.noteId.set,
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
      resource: {
        async create({ args, query }) {
          const res = await query(args);
          await sendResourceCreateEvent(args.data);
          return res;
        },
        async createMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendResourceCreateEvent(d)));
          } else {
            await sendResourceCreateEvent(args.data);
          }
          return res;
        },
        async createManyAndReturn({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendResourceCreateEvent(d)));
          } else {
            await sendResourceCreateEvent(args.data);
          }
          return res;
        },
        async update({ args, query }) {
          const res = await query(args);
          const { uid, resourceId } = res;
          await sendResourceUpdateEvent({ uid, resourceId });
          return res;
        },
        async updateMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendResourceUpdateEvent(d)));
          } else {
            await sendResourceUpdateEvent({
              uid: args.data.uid,
              resourceId: args.data.resourceId,
            });
          }
          return res;
        },
        async upsert({ args, query }) {
          args.create.createdAt = new Date();
          const res = await query(args);

          if (new Date(res['createdAt'] as string).getTime() === args.create.createdAt.getTime()) {
            await sendResourceCreateEvent(args.create);
          } else if (Object.keys(args.update).length > 0) {
            const { uid, resourceId } = res;
            await sendResourceUpdateEvent({ uid, resourceId });
          }

          return res;
        },
      },
      note: {
        async create({ args, query }) {
          const res = await query(args);
          await sendNoteCreateEvent(args.data);
          return res;
        },
        async createMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendNoteCreateEvent(d)));
          } else {
            await sendNoteCreateEvent(args.data);
          }
          return res;
        },
        async createManyAndReturn({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendNoteCreateEvent(d)));
          } else {
            await sendNoteCreateEvent(args.data);
          }
          return res;
        },
        async update({ args, query }) {
          const res = await query(args);
          const { uid, noteId } = res;
          await sendNoteUpdateEvent({ uid, noteId });
          return res;
        },
        async updateMany({ args, query }) {
          const res = await query(args);
          if (Array.isArray(args.data)) {
            await Promise.all(args.data.map((d) => sendNoteUpdateEvent(d)));
          } else {
            await sendNoteUpdateEvent({
              uid: args.data.uid,
              noteId: args.data.noteId,
            });
          }
          return res;
        },
        async upsert({ args, query }) {
          args.create.createdAt = new Date();
          const res = await query(args);

          if (new Date(res['createdAt'] as string).getTime() === args.create.createdAt.getTime()) {
            await sendNoteCreateEvent(args.create);
          } else if (Object.keys(args.update).length > 0) {
            const { uid, noteId } = res;
            await sendNoteUpdateEvent({ uid, noteId });
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
