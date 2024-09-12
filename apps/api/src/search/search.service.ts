import { BadRequestException, Injectable } from '@nestjs/common';
import { cut, extract } from '@node-rs/jieba';
import { PrismaService } from '@/common/prisma.service';
import {
  ResourceMeta,
  ResourceType,
  SearchRequest,
  SearchResult,
  User,
} from '@refly/openapi-schema';
import { RAGService } from '@/rag/rag.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';

interface ProcessedSearchRequest extends SearchRequest {
  tokens: string[];
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private rag: RAGService,
  ) {}

  preprocessSearchRequest(req: SearchRequest): ProcessedSearchRequest {
    if (!req.limit || req.limit <= 0) {
      req.limit = 5;
    }
    if (req.limit > 10) {
      req.limit = 10;
    }
    req.mode ??= 'keyword';
    req.domains ??= ['resource', 'note', 'collection', 'conversation', 'skill'];

    let tokens = cut(req.query);
    if (tokens.length > 5) {
      const extractedTokens = extract(req.query, 5).map((item) => item.keyword);
      if (extractedTokens.length > 0) {
        tokens = extractedTokens;
      }
    }
    return { ...req, tokens };
  }

  async emptySearchResources(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const results = await this.prisma.resource.findMany({
      select: {
        resourceId: true,
        resourceType: true,
        title: true,
        contentPreview: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        uid: user.uid,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });

    return results.map((result) => ({
      id: result.resourceId,
      domain: 'resource',
      title: result.title,
      content: [result.contentPreview],
      metadata: {
        resourceType: result.resourceType as ResourceType,
      },
      createdAt: result.createdAt.toJSON(),
      updatedAt: result.updatedAt.toJSON(),
    }));
  }

  async searchResourcesByKeywords(
    user: User,
    req: ProcessedSearchRequest,
  ): Promise<SearchResult[]> {
    const hits = await this.elasticsearch.searchResources(user, req.query, req.limit || 5);

    return hits.map((hit) => ({
      id: hit._id,
      domain: 'resource',
      title: hit.highlight?.title?.[0] || hit._source.title,
      content: hit.highlight?.content || [hit._source.content],
      metadata: {
        // TODO: confirm if metadata is used
      },
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async searchResourcesByVector(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const nodes = await this.rag.retrieve(user, {
      query: req.query,
      limit: req.limit,
      filter: { nodeTypes: ['resource'] },
    });
    if (nodes.length === 0) {
      return [];
    }

    const resourceIds = [...new Set(nodes.map((node) => node.resourceId).filter((id) => !!id))];
    const resources = await this.prisma.resource.findMany({
      where: {
        resourceId: { in: resourceIds },
        deletedAt: null,
      },
    });
    const resourceMap = new Map(
      resources.map((resource) => [resource.resourceId, JSON.parse(resource.meta) as ResourceMeta]),
    );

    return nodes.map((node) => ({
      id: node.resourceId,
      domain: 'resource',
      title: node.title,
      content: [node.content],
      metadata: {
        resourceMeta: resourceMap.get(node.resourceId),
        resourceType: node.resourceType,
      },
    }));
  }

  async searchResources(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchResources(user, req);
    }

    switch (req.mode) {
      case 'keyword':
        return this.searchResourcesByKeywords(user, req);
      case 'vector':
        return this.searchResourcesByVector(user, req);
      case 'hybrid':
        throw new BadRequestException('Not implemented');
      default:
        return this.searchResourcesByKeywords(user, req);
    }
  }

  async emptySearchNotes(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const notes = await this.prisma.note.findMany({
      select: {
        noteId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });
    return notes.map((note) => ({
      id: note.noteId,
      domain: 'note',
      title: note.title,
      content: [note.content ? note.content.slice(0, 250) + '...' : ''],
      createdAt: note.createdAt.toJSON(),
      updatedAt: note.updatedAt.toJSON(),
    }));
  }

  async searchNotesByKeywords(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const hits = await this.elasticsearch.searchNotes(user, req.query, req.limit || 5);

    return hits.map((hit) => ({
      id: hit._id,
      domain: 'note',
      title: hit.highlight?.title?.[0] || hit._source.title,
      content: hit.highlight?.content || [hit._source.content],
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async searchNotesByVector(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const nodes = await this.rag.retrieve(user, {
      query: req.query,
      limit: req.limit,
      filter: { nodeTypes: ['note'] },
    });
    if (nodes.length === 0) {
      return [];
    }

    return nodes.map((node) => ({
      id: node.noteId,
      domain: 'note',
      title: node.title,
      content: [node.content],
    }));
  }

  async searchNotes(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchNotes(user, req);
    }

    switch (req.mode) {
      case 'keyword':
        return this.searchNotesByKeywords(user, req);
      case 'vector':
        return this.searchNotesByVector(user, req);
      case 'hybrid':
        throw new BadRequestException('Not implemented');
      default:
        return this.searchNotesByKeywords(user, req);
    }
  }

  async emptySearchCollections(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const collections = await this.prisma.collection.findMany({
      select: {
        collectionId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });
    return collections.map((collection) => ({
      id: collection.collectionId,
      domain: 'collection',
      title: collection.title,
      createdAt: collection.createdAt.toJSON(),
      updatedAt: collection.updatedAt.toJSON(),
    }));
  }

  async searchCollections(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchCollections(user, req);
    }

    const hits = await this.elasticsearch.searchCollections(user, req.query, req.limit || 5);

    return hits.map((hit) => ({
      id: hit._id,
      domain: 'collection',
      title: hit.highlight?.title?.[0] || hit._source.title,
      content: hit.highlight?.description || [hit._source.description],
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async emptySearchConversations(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const conversations = await this.prisma.conversation.findMany({
      select: {
        convId: true,
        title: true,
        lastMessage: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { uid: user.uid },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });
    return conversations.map((conversation) => ({
      id: conversation.convId,
      domain: 'conversation',
      title: conversation.title,
      content: [conversation.lastMessage],
      createdAt: conversation.createdAt.toJSON(),
      updatedAt: conversation.updatedAt.toJSON(),
    }));
  }

  async searchConversations(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchConversations(user, req);
    }

    const hits = await this.elasticsearch.searchConversationMessages(
      user,
      req.query,
      req.limit || 5,
    );

    return hits.map((hit) => ({
      id: hit._source.convId,
      domain: 'conversation',
      title: hit.highlight?.convTitle?.[0] || hit._source.convTitle,
      content: hit.highlight?.content || [hit._source.content],
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async emptySearchSkills(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const skills = await this.prisma.skillInstance.findMany({
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
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

  async searchSkills(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchSkills(user, req);
    }

    const hits = await this.elasticsearch.searchSkills(user, req.query, req.limit || 5);

    return hits.map((hit) => ({
      id: hit._id,
      domain: 'skill',
      title: hit.highlight?.displayName?.[0] || hit._source.displayName,
      content: hit.highlight?.description || [hit._source.description],
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async search(user: User, req: SearchRequest): Promise<SearchResult[]> {
    const processedReq = this.preprocessSearchRequest(req);

    const results = await Promise.all(
      processedReq.domains.map((domain) => {
        switch (domain) {
          case 'resource':
            return this.searchResources(user, processedReq);
          case 'note':
            return this.searchNotes(user, processedReq);
          case 'collection':
            return this.searchCollections(user, processedReq);
          case 'conversation':
            return this.searchConversations(user, processedReq);
          case 'skill':
            return this.searchSkills(user, processedReq);
          default:
            return [] as SearchResult[];
        }
      }),
    );

    return results.flat();
  }
}
