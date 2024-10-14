import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import {
  Entity,
  EntityType,
  ResourceMeta,
  ResourceType,
  SearchOptions,
  SearchRequest,
  SearchResult,
  User,
  WebSearchRequest,
  WebSearchResult,
} from '@refly-packages/openapi-schema';
import { RAGService } from '@/rag/rag.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import { LOCALE } from '@refly-packages/common-types';

interface ProcessedSearchRequest extends SearchRequest {}

@Injectable()
export class SearchService {
  private logger = new Logger(SearchService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private rag: RAGService,
  ) {}

  async preprocessSearchRequest(user: User, req: SearchRequest): Promise<SearchRequest[]> {
    req.query = req.query?.trim() || '';

    if (!req.limit || req.limit <= 0) {
      req.limit = 5;
    }
    if (req.limit > 10) {
      req.limit = 10;
    }
    req.mode ??= 'keyword';

    if (req.mode === 'vector') {
      // Currently only resource and note are supported for vector search
      req.domains ??= ['resource', 'note'];
    } else {
      req.domains ??= ['resource', 'note', 'collection', 'conversation', 'skill'];
    }

    const reqList: SearchRequest[] = [];

    if (req.entities?.length > 0) {
      const entities = req.entities.filter((entity) => req.domains.includes(entity.entityType));
      if (entities.length === 0) {
        return [];
      }

      // Add collection resources to entities
      const collectionIds = entities
        .filter((entity) => entity.entityType === 'collection')
        .map((entity) => entity.entityId);
      if (collectionIds.length > 0) {
        const collections = await this.prisma.collection.findMany({
          where: { collectionId: { in: collectionIds }, uid: user.uid, deletedAt: null },
          include: { resources: true },
        });
        collections.forEach((collection) => {
          collection.resources.forEach((resource) => {
            entities.push({
              entityType: 'resource',
              entityId: resource.resourceId,
            });
          });
        });
      }

      const entityMap = new Map<EntityType, Set<Entity>>();

      entities.forEach((entity) => {
        const entitySet = entityMap.get(entity.entityType) || new Set<Entity>();
        entitySet.add(entity);
        entityMap.set(entity.entityType, entitySet);
      });

      entityMap.forEach((entitySet, entityType) => {
        reqList.push({
          ...req,
          domains: [entityType],
          entities: Array.from(entitySet),
        });
      });
    } else {
      req.domains.forEach((domain) => {
        reqList.push({ ...req, domains: [domain] });
      });
    }

    return reqList;
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
    const hits = await this.elasticsearch.searchResources(user, req);

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
      filter: {
        nodeTypes: ['resource'],
        resourceIds: req.entities?.map((entity) => entity.entityId),
      },
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
    if (req.query.length === 0) {
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
    const hits = await this.elasticsearch.searchNotes(user, req);

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
      filter: {
        nodeTypes: ['note'],
        noteIds: req.entities?.map((entity) => entity.entityId),
      },
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
    if (req.query.length === 0) {
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
    if (req.query.length === 0) {
      return this.emptySearchCollections(user, req);
    }

    const hits = await this.elasticsearch.searchCollections(user, req);

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
    if (req.query.length === 0) {
      return this.emptySearchConversations(user, req);
    }

    const hits = await this.elasticsearch.searchConversationMessages(user, req);

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
    if (req.query.length === 0) {
      return this.emptySearchSkills(user, req);
    }

    const hits = await this.elasticsearch.searchSkills(user, req);

    return hits.map((hit) => ({
      id: hit._id,
      domain: 'skill',
      title: hit.highlight?.displayName?.[0] || hit._source.displayName,
      content: hit.highlight?.description || [hit._source.description],
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
    }));
  }

  async webSearch(user: User, req: WebSearchRequest): Promise<WebSearchResult[]> {
    const { query, limit = 8 } = req;
    const locale = user.outputLocale || LOCALE.EN;

    let jsonContent: any = [];
    try {
      const queryPayload = JSON.stringify({
        q: query,
        num: limit,
        hl: locale.toLocaleLowerCase(),
        gl: locale.toLocaleLowerCase() === LOCALE.ZH_CN.toLocaleLowerCase() ? 'cn' : 'us',
      });

      const res = await fetch('https://google.serper.dev/search', {
        method: 'post',
        headers: {
          'X-API-KEY': this.configService.get('credentials.serper'),
          'Content-Type': 'application/json',
        },
        body: queryPayload,
      });
      jsonContent = await res.json();

      // convert to the same format as bing/google
      const contexts: WebSearchResult[] = [];
      if (jsonContent.hasOwnProperty('knowledgeGraph')) {
        const url = jsonContent.knowledgeGraph.descriptionUrl || jsonContent.knowledgeGraph.website;
        const snippet = jsonContent.knowledgeGraph.description;
        if (url && snippet) {
          contexts.push({
            name: jsonContent.knowledgeGraph.title || '',
            url: url,
            snippet: snippet,
          });
        }
      }

      if (jsonContent.hasOwnProperty('answerBox')) {
        const url = jsonContent.answerBox.url;
        const snippet = jsonContent.answerBox.snippet || jsonContent.answerBox.answer;
        if (url && snippet) {
          contexts.push({
            name: jsonContent.answerBox.title || '',
            url: url,
            snippet: snippet,
          });
        }
      }
      if (jsonContent.hasOwnProperty('organic')) {
        for (const c of jsonContent.organic) {
          contexts.push({
            name: c.title,
            url: c.link,
            snippet: c.snippet || '',
          });
        }
      }
      return contexts.slice(0, limit);
    } catch (e) {
      this.logger.error(`onlineSearch error encountered: ${e}`);
      return [];
    }
  }

  async search(user: User, req: SearchRequest, options?: SearchOptions): Promise<SearchResult[]> {
    const reqList = await this.preprocessSearchRequest(user, req);

    const results = await Promise.all(
      reqList.map((req) => {
        switch (req.domains[0]) {
          case 'resource':
            return this.searchResources(user, req);
          case 'note':
            return this.searchNotes(user, req);
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

    if (options?.enableReranker) {
      this.logger.log(`Reranker enabled for query: ${req.query}`);
      const rerankedResults = await this.rag.rerank(req.query, results.flat());
      this.logger.log(`Reranked results: ${JSON.stringify(rerankedResults)}`);

      return rerankedResults;
    }

    return results.flat();
  }
}
