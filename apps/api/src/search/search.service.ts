import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '@/common/prisma.service';
import { SearchRequest, SearchResult } from '@refly/openapi-schema';
import { RAGService } from '@/rag/rag.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService, private rag: RAGService) {}

  async searchResources(user: User, req: SearchRequest): Promise<SearchResult[]> {
    const results = await this.rag.retrieve(user, req);
    return results.map((result) => ({
      id: result.resourceId,
      domain: 'resource',
      title: result.title,
      content: result.content,
      createdAt: '',
      updatedAt: '',
    }));
  }

  async searchCollections(user: User, req: SearchRequest): Promise<SearchResult[]> {
    const tokens = req.query.toLowerCase().split(/\W+/);
    const colls = await this.prisma.collection.findMany({
      select: {
        collectionId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        uid: user.uid,
        OR: [
          ...tokens.map(
            (token) =>
              ({
                title: { contains: token, mode: 'insensitive' },
              } as Prisma.CollectionWhereInput),
          ),
          ...tokens.map(
            (token) =>
              ({
                description: { contains: token, mode: 'insensitive' },
              } as Prisma.CollectionWhereInput),
          ),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });

    return colls.map((coll) => ({
      id: coll.collectionId,
      domain: 'collection',
      title: coll.title,
      content: coll.description,
      createdAt: coll.createdAt.toJSON(),
      updatedAt: coll.updatedAt.toJSON(),
    }));
  }

  async searchConversations(user: User, req: SearchRequest): Promise<SearchResult[]> {
    const tokens = req.query.toLowerCase().split(/\W+/);
    const messages = await this.prisma.chatMessage.findMany({
      select: {
        conversationId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        userId: user.id,
        OR: tokens.map((token) => ({ content: { contains: token, mode: 'insensitive' } })),
      },
      take: req.limit || 5,
    });
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId: user.id,
        id: {
          in: messages.map((message) => message.conversationId),
        },
      },
    });
    const convMap = new Map(conversations.map((conversation) => [conversation.id, conversation]));

    return messages
      .map((message) => {
        const conv = convMap.get(message.conversationId);
        return conv
          ? ({
              id: conv.convId,
              domain: 'conversation',
              title: conv.title,
              content: message.content,
              createdAt: message.createdAt.toJSON(),
              updatedAt: message.updatedAt.toJSON(),
            } as SearchResult)
          : null;
      })
      .filter((res) => res);
  }

  async searchSkills(user: User, req: SearchRequest): Promise<SearchResult[]> {
    const tokens = req.query.toLowerCase().split(/\W+/);
    const skills = await this.prisma.skillInstance.findMany({
      select: {
        skillId: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        uid: user.uid,
        OR: tokens.map((token) => ({ displayName: { contains: token, mode: 'insensitive' } })),
      },
      take: req.limit || 5,
    });

    return skills.map((skill) => ({
      id: skill.skillId,
      domain: 'skill',
      title: skill.displayName,
      createdAt: skill.createdAt.toJSON(),
      updatedAt: skill.updatedAt.toJSON(),
    }));
  }

  async search(user: User, req: SearchRequest): Promise<SearchResult[]> {
    req.domains ||= ['resource', 'collection', 'conversation', 'skill'];

    const results = await Promise.all(
      req.domains.map((domain) => {
        switch (domain) {
          case 'resource':
            return this.searchResources(user, req);
          case 'collection':
            return this.searchCollections(user, req);
          case 'conversation':
            return this.searchConversations(user, req);
          case 'skill':
            return this.searchSkills(user, req);
          default:
            return [] as SearchResult[];
        }
      }),
    );

    return results.flat();
  }
}
