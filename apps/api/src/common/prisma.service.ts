import { EventService } from '@/event/event.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private logger = new Logger(PrismaService.name);

  constructor(private moduleRef: ModuleRef) {
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
    const eventSvc = this.moduleRef.resolve(EventService);
    console.log('eventSvc', eventSvc);
    // const eventSvc = this.eventSvc;

    // this.$on('query' as never, (e: any) => {
    //   this.logger.log(`query: ${e.query}, param: ${e.params}, duration: ${e.duration}ms`);
    // });
    await this.$connect();
    this.logger.log('Connected to database');

    // this.$extends({
    //   query: {
    //     collection: {
    //       async $allOperations({ operation, args, query }) {
    //         switch (operation) {
    //           case 'create':
    //             const res = await query(args);
    //             await eventSvc.report({
    //               uid: args.data.uid,
    //               eventType: 'create',
    //               entityType: 'collection',
    //               entityId: args.data.collectionId,
    //             });
    //             return res;

    //           case 'createMany':
    //             const resMany = await query(args);
    //             if (Array.isArray(args.data)) {
    //               await Promise.all(
    //                 args.data.map((d) =>
    //                   eventSvc.report({
    //                     uid: d.uid,
    //                     eventType: 'create',
    //                     entityType: 'collection',
    //                     entityId: d.collectionId,
    //                   }),
    //                 ),
    //               );
    //             } else {
    //               await eventSvc.report({
    //                 uid: args.data.uid,
    //                 eventType: 'create',
    //                 entityType: 'collection',
    //                 entityId: args.data.collectionId,
    //               });
    //             }
    //             return resMany;

    //           case 'createManyAndReturn':
    //             const resManyAndReturn = await query(args);
    //             if (Array.isArray(args.data)) {
    //               await Promise.all(
    //                 args.data.map((d) =>
    //                   eventSvc.report({
    //                     uid: d.uid,
    //                     eventType: 'create',
    //                     entityType: 'collection',
    //                     entityId: d.collectionId,
    //                   }),
    //                 ),
    //               );
    //             } else {
    //               await eventSvc.report({
    //                 uid: args.data.uid,
    //                 eventType: 'create',
    //                 entityType: 'collection',
    //                 entityId: args.data.collectionId,
    //               });
    //             }
    //             return resManyAndReturn;

    //           case 'update':
    //             const resUpdate = await query(args);
    //             await eventSvc.report({
    //               uid: typeof args.data.uid === 'string' ? args.data.uid : args.data.uid.set,
    //               eventType: 'update',
    //               entityType: 'collection',
    //               entityId:
    //                 typeof args.data.collectionId === 'string'
    //                   ? args.data.collectionId
    //                   : args.data.collectionId.set,
    //             });
    //             return resUpdate;

    //           case 'updateMany':
    //             const resUpdateMany = await query(args);
    //             await eventSvc.report({
    //               uid: typeof args.data.uid === 'string' ? args.data.uid : args.data.uid.set,
    //               eventType: 'update',
    //               entityType: 'collection',
    //               entityId:
    //                 typeof args.data.collectionId === 'string'
    //                   ? args.data.collectionId
    //                   : args.data.collectionId.set,
    //             });
    //             return resUpdateMany;

    //           case 'upsert':
    //             const createdAt =
    //               typeof args.create?.createdAt === 'string'
    //                 ? new Date(args.create.createdAt)
    //                 : args.create?.createdAt;
    //             const resUpsert = await query(args);
    //             if ((resUpsert['createdAt'] as Date).getTime() === createdAt.getTime()) {
    //               await eventSvc.report({
    //                 uid: args.create.uid,
    //                 eventType: 'create',
    //                 entityType: 'collection',
    //                 entityId: args.create.collectionId,
    //               });
    //             } else if (Object.keys(args.update).length > 0) {
    //               await eventSvc.report({
    //                 uid: args.create.uid,
    //                 eventType: 'update',
    //                 entityType: 'collection',
    //                 entityId: args.create.collectionId,
    //               });
    //             }

    //             return resUpsert;
    //           default:
    //             return query(args);
    //         }
    //       },
    //     },
    //   },
    // });
  }
}
