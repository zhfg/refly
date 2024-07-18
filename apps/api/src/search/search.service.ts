import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { cut, extract } from '@node-rs/jieba';
import { PrismaService } from '@/common/prisma.service';
import { SearchRequest, SearchResult } from '@refly/openapi-schema';
import { RAGService } from '@/rag/rag.service';

interface ProcessedSearchRequest extends SearchRequest {
  tokens: string[];
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService, private rag: RAGService) {}

  preprocessSearchRequest(req: SearchRequest): ProcessedSearchRequest {
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
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        uid: user.uid,
      },
      orderBy: { updatedAt: 'desc' },
      take: req.limit || 5,
    });

    return results.map((result) => ({
      id: result.resourceId,
      domain: 'resource',
      title: result.title,
      content: [result.content.slice(0, 50) + '...'], // TODO: truncate in sql to reduce traffic
      createdAt: result.createdAt.toJSON(),
      updatedAt: result.updatedAt.toJSON(),
    }));
  }

  async searchResources(user: User, req: ProcessedSearchRequest): Promise<SearchResult[]> {
    const tokens = req.tokens;

    if (tokens.length === 0) {
      return this.emptySearchResources(user, req);
    }

    interface ResourceResult {
      resource_id: string;
      created_at: string;
      updated_at: string;
      title: string;
      content: string;
    }
    const tokenList = tokens.join(' ');
    const tokenOrList = tokens.join(' OR ');
    const resources = await this.prisma.$queryRaw<ResourceResult[]>`
      SELECT   resource_id,
               created_at,
               updated_at,
               pgroonga_highlight_html(
                 title, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS title,
               pgroonga_highlight_html(
                 content, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS content
      FROM     resources
      WHERE    uid = ${user.uid}
      AND      (title &@~ ${tokenList}::TEXT OR content &@~ ${tokenOrList}::TEXT)
      ORDER BY pgroonga_score(tableoid, ctid) DESC,
               updated_at DESC
      LIMIT    ${req.limit || 5}
    `;

    return resources.map((resource) => ({
      id: resource.resource_id,
      domain: 'resource',
      title: resource.title,
      content: resource.content
        .split(/\r?\n+/)
        .filter((line) => /<span\b[^>]*>(.*?)<\/span>/gi.test(line)),
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
    }));
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

    interface CollectionResult {
      collection_id: string;
      created_at: string;
      updated_at: string;
      title: string;
      description: string;
    }
    const tokenList = tokens.join(' ');
    const tokenOrList = tokens.join(' OR ');
    const colls = await this.prisma.$queryRaw<CollectionResult[]>`
      SELECT   collection_id,
               created_at,
               updated_at,
               pgroonga_highlight_html(
                 title, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS title,
               pgroonga_highlight_html(
                 description, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS description
      FROM     collections
      WHERE    uid = ${user.uid}
      AND      (title &@~ ${tokenOrList}::TEXT OR description &@~ ${tokenOrList}::TEXT)
      ORDER BY pgroonga_score(tableoid, ctid) DESC,
               updated_at DESC
      LIMIT    ${req.limit || 5}
    `;

    return colls.map((coll) => ({
      id: coll.collection_id,
      domain: 'collection',
      title: coll.title,
      content: [coll.description],
      createdAt: coll.created_at,
      updatedAt: coll.updated_at,
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
      where: { userId: user.id },
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

    interface MessageResult {
      conversation_id: number;
      content: string;
    }
    const tokenList = tokens.join(' ');
    const tokenOrList = tokens.join(' OR ');
    const messages = await this.prisma.$queryRaw<MessageResult[]>`
      SELECT   conversation_id,
               pgroonga_highlight_html(
                 content, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS content
      FROM     chat_messages
      WHERE    user_id = ${user.id}
      AND      content &@~ ${tokenOrList}::TEXT
      ORDER BY pgroonga_score(tableoid, ctid) DESC
    `;

    if (messages.length === 0) {
      return [];
    }

    interface ConversationResult {
      id: number;
      conv_id: string;
      title: string;
      created_at: string;
      updated_at: string;
    }
    const ids = [...new Set(messages.map((message) => message.conversation_id))];
    const conversations = await this.prisma.$queryRaw<ConversationResult[]>`
      SELECT   id,
               conv_id,
               created_at,
               updated_at,
               pgroonga_highlight_html(
                 title, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS title
      FROM     conversations
      WHERE    user_id = ${user.id}
      AND      id IN (${Prisma.join(ids)})
      ORDER BY updated_at DESC
      LIMIT    ${req.limit || 5}
    `;

    return conversations.map((conversation) => ({
      id: conversation.conv_id,
      domain: 'conversation',
      title: conversation.title,
      content: messages
        .filter((message) => message.conversation_id === conversation.id)
        .map((message) => message.content),
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
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

    interface SkillResult {
      skill_id: string;
      created_at: string;
      updated_at: string;
      content: string;
    }
    const tokenList = tokens.join(' ');
    const tokenOrList = tokens.join(' OR ');
    const skills = await this.prisma.$queryRaw<SkillResult[]>`
      SELECT   skill_id,
               created_at,
               updated_at,
               pgroonga_highlight_html(
                 display_name, pgroonga_query_extract_keywords(${tokenList}::TEXT)
               ) AS content
      FROM     skill_instances
      WHERE    uid = ${user.uid}
      AND      deleted_at IS NULL
      AND      display_name &@~ ${tokenOrList}::TEXT
      ORDER BY pgroonga_score(tableoid, ctid) DESC,
               updated_at DESC
      LIMIT    ${req.limit || 5}
    `;

    return skills.map((skill) => ({
      id: skill.skill_id,
      domain: 'skill',
      title: skill.content,
      createdAt: skill.created_at,
      updatedAt: skill.updated_at,
    }));
  }

  async search(user: User, req: SearchRequest): Promise<SearchResult[]> {
    req.domains ||= ['resource', 'collection', 'conversation', 'skill'];
    const processedReq = this.preprocessSearchRequest(req);

    const results = await Promise.all(
      req.domains.map((domain) => {
        switch (domain) {
          case 'resource':
            return this.searchResources(user, processedReq);
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
