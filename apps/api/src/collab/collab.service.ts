import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Y from 'yjs';
import { Request } from 'express';
import { WebSocket } from 'ws';
import { Server, Hocuspocus } from '@hocuspocus/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { MINIO_INTERNAL } from '@/common/minio.service';
import { MinioService } from '@/common/minio.service';
import { RAGService } from '@/rag/rag.service';
import { Prisma } from '@prisma/client';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MiscService } from '@/misc/misc.service';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { PrismaService } from '@/common/prisma.service';
import { IDPrefix, incrementalMarkdownUpdate, state2Markdown } from '@refly-packages/utils';
import { streamToBuffer } from '@/utils/stream';
import { CollabContext, isCanvasContext, isDocumentContext } from './collab.dto';

@Injectable()
export class CollabService {
  private logger = new Logger(CollabService.name);
  private server: Hocuspocus;

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
      port: this.config.get<number>('wsPort'),
      onAuthenticate: (payload) => this.authenticate(payload),
      onLoadDocument: (payload) => this.loadDocument(payload),
      onStoreDocument: (payload) => this.storeDocument(payload),
    });
  }

  handleConnection(connection: WebSocket, request: Request) {
    this.server.handleConnection(connection, request);
  }

  async authenticate({ token, documentName }: { token: string; documentName: string }) {
    const decoded = verify(token, this.config.getOrThrow('auth.jwt.secret'));
    if (!decoded) {
      throw new Error('Not authorized!');
    }
    let payload: JwtPayload;
    if (typeof decoded === 'string') {
      payload = JSON.parse(decoded);
    } else {
      payload = decoded as JwtPayload;
    }

    const user = await this.prisma.user.findFirst({
      where: { uid: payload.uid },
    });
    if (!user) {
      throw new Error(`user not found`);
    }

    let context: CollabContext;
    if (documentName.startsWith(IDPrefix.DOCUMENT)) {
      const doc = await this.prisma.document.findFirst({
        where: { docId: documentName, deletedAt: null },
      });
      context = { user, entity: doc, entityType: 'document' };
    } else if (documentName.startsWith(IDPrefix.CANVAS)) {
      const canvas = await this.prisma.canvas.findFirst({
        where: { canvasId: documentName, deletedAt: null },
      });
      context = { user, entity: canvas, entityType: 'canvas' };
    } else {
      throw new Error(`unknown document name: ${documentName}`);
    }

    if (context.entity.uid !== payload.uid) {
      throw new Error(`user not authorized: ${documentName}`);
    }

    this.logger.log(`document connected: ${documentName}`);

    // Set contextual data to use it in other hooks
    return context;
  }

  private async loadDocument({ document, context }: { document: Y.Doc; context: CollabContext }) {
    const { entity } = context;
    const { stateStorageKey } = entity;
    if (!stateStorageKey) return null;

    try {
      const readable = await this.minio.client.getObject(stateStorageKey);
      const state = await streamToBuffer(readable);
      Y.applyUpdate(document, state);
    } catch (err) {
      this.logger.error(`fetch state failed for ${stateStorageKey}, err: ${err.stack}`);
      return null;
    }
  }

  private async storeDocumentEntity({
    state,
    context,
  }: {
    state: Buffer;
    context: Extract<CollabContext, { entityType: 'document' }>;
  }) {
    const { user, entity: doc } = context;

    if (!doc) {
      this.logger.warn(`document is empty for context: ${JSON.stringify(context)}`);
      return;
    }

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
    context.entity = updatedDoc;

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
  }

  private async storeCanvasEntity({
    state,
    document,
    context,
  }: {
    state: Buffer;
    document: Y.Doc;
    context: Extract<CollabContext, { entityType: 'canvas' }>;
  }) {
    const { user, entity: canvas } = context;

    if (!canvas) {
      this.logger.warn(`canvas is empty for context: ${JSON.stringify(context)}`);
      return;
    }

    const stateStorageKey = canvas.stateStorageKey || `state/${canvas.canvasId}`;
    await this.minio.client.putObject(stateStorageKey, state);

    const title = document.getText('title').toJSON();

    const stateStorageStat = await this.minio.client.statObject(stateStorageKey);

    const canvasUpdates: Prisma.CanvasUpdateInput = {
      storageSize: stateStorageStat.size,
    };
    if (!canvas.stateStorageKey) {
      canvasUpdates.stateStorageKey = stateStorageKey;
    }
    if (canvas.title !== title) {
      canvasUpdates.title = title;
    }
    this.logger.log(`canvas ${canvas.canvasId} updates: ${JSON.stringify(canvasUpdates)}`);

    const updatedCanvas = await this.prisma.canvas.update({
      where: { canvasId: canvas.canvasId, uid: user.uid },
      data: canvasUpdates,
    });
    context.entity = updatedCanvas;

    await this.subscriptionService.syncStorageUsage({
      uid: user.uid,
      timestamp: new Date(),
    });
  }

  async storeDocument({
    document,
    context,
  }: {
    documentName: string;
    document: Y.Doc;
    context: CollabContext;
  }) {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    if (isDocumentContext(context)) {
      return this.storeDocumentEntity({ state, context });
    } else if (isCanvasContext(context)) {
      return this.storeCanvasEntity({ state, document, context });
    } else {
      this.logger.warn(`unknown context entity type: ${JSON.stringify(context)}`);
      return null;
    }
  }

  async openDirectConnection(documentName: string, context?: CollabContext) {
    return this.server.openDirectConnection(documentName, context);
  }

  async modifyDocument(documentName: string, update: string) {
    const { document } = await this.server.openDirectConnection(documentName);
    incrementalMarkdownUpdate(document, update);
  }
}
