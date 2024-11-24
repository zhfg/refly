import { Request } from 'express';
import { WebSocket } from 'ws';
import { Server, Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { CollabService } from '@/collab/collab.service';

@WebSocketGateway()
export class CollabGateway implements OnGatewayConnection {
  private server: Hocuspocus;

  constructor(private config: ConfigService, private collabService: CollabService) {
    this.server = Server.configure({
      port: this.config.get<number>('wsPort'),
      extensions: [
        new Database({
          fetch: (payload) => this.collabService.fetch(payload),
          store: (payload) => this.collabService.store(payload),
        }),
      ],
      onAuthenticate: (payload) => this.collabService.authenticate(payload),
    });
  }

  handleConnection(connection: WebSocket, request: Request): void {
    this.server.handleConnection(connection, request);
  }
}
