import { Request } from 'express';
import { WebSocket } from 'ws';
import { Inject, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Server, Hocuspocus } from '@hocuspocus/server';
import { Logger as HocuspocusLogger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { MINIO_INTERNAL, MinioService } from '@/common/minio.service';
import { PrismaService } from '@/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/auth/dto';
import { Canvas, Prisma, User } from '@prisma/client';
import { state2Markdown } from '@refly-packages/utils';
import { RAGService } from '@/rag/rag.service';
import { streamToBuffer } from '@/utils';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MiscService } from '@/misc/misc.service';

interface CanvasContext {
  canvas: Canvas;
  user: User;
}

@WebSocketGateway()
export class CanvasWsGateway implements OnGatewayConnection {
  private server: Hocuspocus;
  private logger = new Logger(CanvasWsGateway.name);

  constructor(
    private rag: RAGService,
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private config: ConfigService,
    private miscService: MiscService,
    private subscriptionService: SubscriptionService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
  ) {
    this.server = Server.configure({
      port: config.get<number>('wsPort'),
      extensions: [
        new HocuspocusLogger({ log: (...args) => this.logger.log(args.join('; ')) }),
        new Database({
          fetch: async ({ context }: { context: CanvasContext }) => {
            const { canvas } = context;
            if (!canvas.stateStorageKey) return null;
            try {
              const readable = await this.minio.client.getObject(canvas.stateStorageKey);
              return await streamToBuffer(readable);
            } catch (err) {
              this.logger.error(
                `fetch state failed for ${canvas.stateStorageKey}, err: ${err.stack}`,
              );
              return null;
            }
          },
          store: async ({ state, context }: { state: Buffer; context: CanvasContext }) => {
            const { user, canvas } = context;

            const content = state2Markdown(state);
            const storageKey = canvas.storageKey || `canvas/${canvas.canvasId}.txt`;
            const stateStorageKey = canvas.stateStorageKey || `state/${canvas.canvasId}`;

            // Save content and ydoc state to object storage
            await Promise.all([
              this.minio.client.putObject(storageKey, content),
              this.minio.client.putObject(stateStorageKey, state),
            ]);

            // Prepare canvas updates
            const canvasUpdates: Prisma.CanvasUpdateInput = {};
            if (!canvas.storageKey) {
              canvasUpdates.storageKey = storageKey;
            }
            if (!canvas.stateStorageKey) {
              canvasUpdates.stateStorageKey = stateStorageKey;
            }
            if (canvas.contentPreview !== content.slice(0, 500)) {
              canvasUpdates.contentPreview = content.slice(0, 500);
            }

            // Re-calculate storage size
            const [storageStat, stateStorageStat] = await Promise.all([
              this.minio.client.statObject(storageKey),
              this.minio.client.statObject(stateStorageKey),
            ]);
            canvasUpdates.storageSize = storageStat.size + stateStorageStat.size;

            // Re-index content to elasticsearch and vector store
            const [, { size }] = await Promise.all([
              this.elasticsearch.upsertCanvas({
                id: canvas.canvasId,
                projectId: canvas.projectId,
                content,
                uid: canvas.uid,
              }),
              this.rag.indexDocument(user, {
                pageContent: content,
                metadata: {
                  nodeType: 'canvas',
                  title: canvas.title,
                  canvasId: canvas.canvasId,
                },
              }),
            ]);
            canvasUpdates.vectorSize = size;

            const updatedCanvas = await this.prisma.canvas.update({
              where: { canvasId: canvas.canvasId },
              data: canvasUpdates,
            });
            context.canvas = updatedCanvas;

            await this.subscriptionService.syncStorageUsage({
              uid: user.uid,
              timestamp: new Date(),
            });

            // Vacuum unused files
            // const staticPrefix = this.config.get('staticEndpoint');
            // const fileKeys = content
            //   .match(new RegExp(`${staticPrefix}([^)]+)`, 'g'))
            //   ?.map((match) => match.slice(staticPrefix.length));
            // await this.miscService.compareAndRemoveFiles(user, {
            //   entityId: note.noteId,
            //   entityType: 'note',
            //   objectKeys: fileKeys,
            // });
          },
        }),
      ],
      onAuthenticate: async ({ token, documentName }) => {
        const decoded = jwt.verify(token, this.config.getOrThrow('auth.jwt.secret'));
        if (!decoded) {
          throw new Error('Not authorized!');
        }
        let payload: JwtPayload;
        if (typeof decoded === 'string') {
          payload = JSON.parse(decoded);
        } else {
          payload = decoded as JwtPayload;
        }

        const canvas = await this.prisma.canvas.findFirst({
          where: { canvasId: documentName, deletedAt: null },
        });
        if (canvas.uid !== payload.uid) {
          throw new Error(`user not authorized: ${documentName}`);
        }
        const user = await this.prisma.user.findFirst({
          where: { uid: payload.uid },
        });
        if (!user) {
          throw new Error(`user not found`);
        }

        // Set contextual data to use it in other hooks
        return { user, canvas } as CanvasContext;
      },
    });
  }

  handleConnection(connection: WebSocket, request: Request): void {
    this.server.handleConnection(connection, request);
  }
}
