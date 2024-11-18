import { Request } from 'express';
import { WebSocket } from 'ws';
import { Inject, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Server, Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { MINIO_INTERNAL, MinioService } from '@/common/minio.service';
import { PrismaService } from '@/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/auth/dto';
import { Document, Prisma, User } from '@prisma/client';
import { state2Markdown } from '@refly-packages/utils';
import { RAGService } from '@/rag/rag.service';
import { streamToBuffer } from '@/utils';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MiscService } from '@/misc/misc.service';

interface DocumentContext {
  doc: Document;
  user: User;
}

@WebSocketGateway()
export class DocumentWsGateway implements OnGatewayConnection {
  private server: Hocuspocus;
  private logger = new Logger(DocumentWsGateway.name);

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
        new Database({
          fetch: async ({ context }: { context: DocumentContext }) => {
            const { doc: canvas } = context;
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
          store: async ({ state, context }: { state: Buffer; context: DocumentContext }) => {
            const { user, doc } = context;

            const content = state2Markdown(state);
            const storageKey = doc.storageKey || `doc/${doc.docId}.txt`;
            const stateStorageKey = doc.stateStorageKey || `state/${doc.docId}`;

            // Save content and ydoc state to object storage
            await Promise.all([
              this.minio.client.putObject(storageKey, content),
              this.minio.client.putObject(stateStorageKey, state),
            ]);

            // Prepare canvas updates
            const docUpdates: Prisma.DocumentUpdateInput = {};
            if (!doc.storageKey) {
              docUpdates.storageKey = storageKey;
            }
            if (!doc.stateStorageKey) {
              docUpdates.stateStorageKey = stateStorageKey;
            }
            if (doc.contentPreview !== content.slice(0, 500)) {
              docUpdates.contentPreview = content.slice(0, 500);
            }

            // Re-calculate storage size
            const [storageStat, stateStorageStat] = await Promise.all([
              this.minio.client.statObject(storageKey),
              this.minio.client.statObject(stateStorageKey),
            ]);
            docUpdates.storageSize = storageStat.size + stateStorageStat.size;

            // Re-index content to elasticsearch and vector store
            const [, { size }] = await Promise.all([
              this.elasticsearch.upsertDocument({
                id: doc.docId,
                content,
                uid: doc.uid,
              }),
              this.rag.indexDocument(user, {
                pageContent: content,
                metadata: {
                  nodeType: 'document',
                  title: doc.title,
                  docId: doc.docId,
                },
              }),
            ]);
            docUpdates.vectorSize = size;

            const updatedDoc = await this.prisma.document.update({
              where: { docId: doc.docId },
              data: docUpdates,
            });
            context.doc = updatedDoc;

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

        const doc = await this.prisma.document.findFirst({
          where: { docId: documentName, deletedAt: null },
        });
        if (doc.uid !== payload.uid) {
          throw new Error(`user not authorized: ${documentName}`);
        }
        const user = await this.prisma.user.findFirst({
          where: { uid: payload.uid },
        });
        if (!user) {
          throw new Error(`user not found`);
        }

        // Set contextual data to use it in other hooks
        return { user, doc } as DocumentContext;
      },
    });
  }

  handleConnection(connection: WebSocket, request: Request): void {
    this.server.handleConnection(connection, request);
  }
}
