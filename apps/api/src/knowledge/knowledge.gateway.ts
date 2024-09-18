import { Request } from 'express';
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
import { Note, Prisma, User } from '@prisma/client';
import { state2Markdown } from '@refly/utils';
import { RAGService } from '@/rag/rag.service';
import { streamToBuffer } from '@/utils';
import { ElasticsearchService } from '@/common/elasticsearch.service';

interface NoteContext {
  note: Note;
  user: User;
}

@WebSocketGateway()
export class NoteWsGateway implements OnGatewayConnection {
  private server: Hocuspocus;
  private logger = new Logger(NoteWsGateway.name);

  constructor(
    private rag: RAGService,
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private config: ConfigService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
  ) {
    this.server = Server.configure({
      port: config.get<number>('wsPort'),
      extensions: [
        new HocuspocusLogger({ log: this.logger.log }),
        new Database({
          fetch: async ({ context }: { context: NoteContext }) => {
            const { note } = context;
            if (!note.stateStorageKey) return null;
            try {
              const readable = await this.minio.client.getObject(note.stateStorageKey);
              return await streamToBuffer(readable);
            } catch (err) {
              this.logger.error(
                `fetch state failed for ${note.stateStorageKey}, err: ${err.stack}`,
              );
              return null;
            }
          },
          store: async ({ state, context }: { state: Buffer; context: NoteContext }) => {
            const { user, note } = context;

            const content = state2Markdown(state);
            const storageKey = note.storageKey || `note/${note.noteId}.txt`;
            const stateStorageKey = note.stateStorageKey || `state/${note.noteId}`;

            // Save content and ydoc state to object storage
            await Promise.all([
              this.minio.client.putObject(context.note.storageKey, content),
              this.minio.client.putObject(context.note.stateStorageKey, state),
            ]);

            // Prepare note updates
            const notesUpdates: Prisma.NoteUpdateInput = {};
            if (!note.storageKey) {
              notesUpdates.storageKey = storageKey;
            }
            if (!note.stateStorageKey) {
              notesUpdates.stateStorageKey = stateStorageKey;
            }
            if (note.contentPreview !== content.slice(0, 500)) {
              notesUpdates.contentPreview = content.slice(0, 500);
            }

            // Re-calculate storage size
            const [storageStat, stateStorageStat] = await Promise.all([
              this.minio.client.statObject(context.note.storageKey),
              this.minio.client.statObject(context.note.stateStorageKey),
            ]);
            notesUpdates.storageSize = storageStat.size + stateStorageStat.size;

            // Re-index content to elasticsearch and vector store
            const [, { size }] = await Promise.all([
              this.elasticsearch.upsertNote({
                id: note.noteId,
                content,
                uid: note.uid,
              }),
              this.rag.indexContent(user, {
                pageContent: content,
                metadata: { nodeType: 'note', title: note.title, noteId: note.noteId },
              }),
            ]);
            notesUpdates.vectorSize = size;

            const updatedNote = await this.prisma.note.update({
              where: { noteId: note.noteId },
              data: notesUpdates,
            });
            context.note = updatedNote;
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

        const note = await this.prisma.note.findFirst({
          where: { noteId: documentName, deletedAt: null },
        });
        if (note.uid !== payload.uid) {
          throw new Error(`user not authorized: ${documentName}`);
        }
        const user = await this.prisma.user.findFirst({
          where: { uid: payload.uid },
        });
        if (!user) {
          throw new Error(`user not found`);
        }

        // Set contextual data to use it in other hooks
        return { user, note } as NoteContext;
      },
    });
  }

  handleConnection(connection: WebSocket, request: Request): void {
    this.server.handleConnection(connection, request);
  }
}
