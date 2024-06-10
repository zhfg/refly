import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Server, Hocuspocus } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { MinioService } from '../common/minio.service';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth/dto';
import { Resource, User } from '@prisma/client';

interface NoteContext {
  resource: Resource;
  user: User;
}

@WebSocketGateway(1234, {
  cors: {
    origin: '*',
  },
})
export class NoteWsGateway implements OnGatewayConnection {
  private server: Hocuspocus;

  constructor(
    private minio: MinioService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.server = Server.configure({
      port: 1234,
      extensions: [
        new Logger(),
        new Database({
          fetch: async ({ context }: { context: NoteContext }) => {
            return await this.minio.downloadData(context.resource.stateStorageKey);
          },
          store: async ({ state, context }: { state: Buffer; context: NoteContext }) => {
            await this.minio.uploadData(context.resource.stateStorageKey, state);
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

        const resource = await this.prisma.resource.findFirst({
          where: { resourceId: documentName, deletedAt: null },
        });
        if (resource.userId !== Number(payload.id)) {
          throw new Error(`user not authorized: ${documentName}`);
        }
        const user = await this.prisma.user.findUnique({
          where: { id: Number(payload.id) },
        });
        if (!user) {
          throw new Error(`user not found`);
        }

        if (!resource.stateStorageKey) {
          resource.stateStorageKey = `state/${resource.resourceId}`;
          await this.prisma.resource.update({
            where: { resourceId: resource.resourceId },
            data: { stateStorageKey: resource.stateStorageKey },
          });
        }

        // Set contextual data to use it in other hooks
        return { user, resource } as NoteContext;
      },
      onDisconnect: async (data) => {
        return null;
      },
    });
  }

  handleConnection(connection: WebSocket, request: Request): void {
    this.server.handleConnection(connection, request);
  }
}
