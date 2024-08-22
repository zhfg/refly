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
import { Note, User } from '@prisma/client';
import { state2Markdown } from '@refly/utils';
import { RAGService } from '@/rag/rag.service';
import { streamToBuffer } from '@/utils';

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
    private config: ConfigService,
    @Inject(MINIO_INTERNAL) private minio: MinioService,
  ) {
    this.server = Server.configure({
      port: config.get<number>('wsPort'),
      extensions: [
        new HocuspocusLogger(),
        new Database({
          fetch: async ({ context }: { context: NoteContext }) => {
            const { note } = context;
            if (!note.stateStorageKey) return null;
            try {
              const readable = await this.minio.client.getObject(note.stateStorageKey);
              return await streamToBuffer(readable);
            } catch (err) {
              this.logger.error(`fetch state failed for ${note}, err: ${err.stack}`);
              return null;
            }
          },
          store: async ({ state, context }: { state: Buffer; context: NoteContext }) => {
            const { note } = context;
            note.stateStorageKey ||= `state/${note.noteId}`;

            const { noteId, stateStorageKey } = note;
            const content = state2Markdown(state);

            await Promise.all([
              this.prisma.note.update({
                where: { noteId },
                data: { content, stateStorageKey },
              }),
              this.minio.client.putObject(stateStorageKey, state),

              // TODO: put this in delayed queue
              // this.rag.saveDataForUser(user, {
              //   chunks: await this.rag.indexContent({
              //     pageContent: content,
              //     metadata: { nodeType: 'note', title: note.title, noteId: note.noteId },
              //   }),
              // }),
            ]);
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
