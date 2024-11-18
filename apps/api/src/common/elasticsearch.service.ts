import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { MessageType } from '@prisma/client';
import { SearchRequest, User } from '@refly-packages/openapi-schema';

interface ResourceDocument {
  id: string;
  title?: string;
  content?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  uid: string;
}

interface DocumentDocument {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  uid: string;
}

interface ProjectDocument {
  id: string;
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  uid: string;
}

interface ConversationMessageDocument {
  id: string;
  convId?: string;
  convTitle?: string;
  content?: string;
  type?: MessageType;
  createdAt?: string;
  updatedAt?: string;
  uid: string;
}

interface SkillDocument {
  id: string;
  displayName?: string;
  description?: string;
  tplName?: string;
  createdAt?: string;
  updatedAt?: string;
  uid: string;
}

const commonSettings = {
  analysis: {
    analyzer: {
      default: {
        type: 'icu_analyzer',
      },
    },
  },
};

export const indexConfig = {
  resource: {
    index: 'refly_resources',
    settings: commonSettings,
    properties: {
      title: { type: 'text' },
      content: { type: 'text' },
      url: { type: 'keyword' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      uid: { type: 'keyword' },
    },
  },
  document: {
    index: 'refly_documents',
    settings: commonSettings,
    properties: {
      title: { type: 'text' },
      content: { type: 'text' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      uid: { type: 'keyword' },
    },
  },
  project: {
    index: 'refly_projects',
    settings: commonSettings,
    properties: {
      title: { type: 'text' },
      description: { type: 'text' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      uid: { type: 'keyword' },
    },
  },
  conversationMessage: {
    index: 'refly_conversation_messages',
    settings: commonSettings,
    properties: {
      convId: { type: 'keyword' },
      convTitle: { type: 'text' },
      content: { type: 'text' },
      type: { type: 'keyword' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      uid: { type: 'keyword' },
    },
  },
  skill: {
    index: 'refly_skills',
    settings: commonSettings,
    properties: {
      displayName: { type: 'text' },
      description: { type: 'text' },
      tplName: { type: 'keyword' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      uid: { type: 'keyword' },
    },
  },
};

type IndexConfigValue = (typeof indexConfig)[keyof typeof indexConfig];

interface SearchHit<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
  highlight?: {
    [key: string]: string[];
  };
}

interface SearchResponse<T> {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchHit<T>[];
  };
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);

  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      node: this.configService.getOrThrow('elasticsearch.url'),
      auth: {
        username: this.configService.get('elasticsearch.username'),
        password: this.configService.get('elasticsearch.password'),
      },
    });
  }

  async onModuleInit() {
    await Promise.all(Object.values(indexConfig).map((config) => this.ensureIndexExists(config)));
  }

  private async ensureIndexExists(indexConfig: IndexConfigValue) {
    const { body: indexExists } = await this.client.indices.exists({ index: indexConfig.index });

    if (!indexExists) {
      const { body } = await this.client.indices.create({
        index: indexConfig.index,
        body: {
          settings: indexConfig.settings,
          mappings: {
            properties: indexConfig.properties,
          },
        },
      });
      this.logger.log(`Index created successfully: ${JSON.stringify(body)}`);
    } else {
      this.logger.log(`Index already exists: ${indexConfig.index}`);
    }
  }

  private async upsertESDoc<T extends { id: string }>(index: string, document: T) {
    try {
      const result = await this.client.update({
        index,
        id: document.id,
        body: {
          doc: document,
          doc_as_upsert: true,
        },
      });
      this.logger.log(`Document upserted successfully, index: ${index}, id: ${document.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error upserting document ${document.id} to index ${index}: ${error}`);
      throw error;
    }
  }

  async upsertResource(resource: ResourceDocument) {
    return this.upsertESDoc(indexConfig.resource.index, resource);
  }

  async upsertProject(project: ProjectDocument) {
    return this.upsertESDoc(indexConfig.project.index, project);
  }

  async upsertDocument(document: DocumentDocument) {
    return this.upsertESDoc(indexConfig.document.index, document);
  }

  async upsertConversationMessage(message: ConversationMessageDocument) {
    return this.upsertESDoc(indexConfig.conversationMessage.index, message);
  }

  async upsertSkill(skill: SkillDocument) {
    return this.upsertESDoc(indexConfig.skill.index, skill);
  }

  async deleteResource(resourceId: string) {
    return this.client.delete(
      {
        index: indexConfig.resource.index,
        id: resourceId,
      },
      { ignore: [404] },
    );
  }

  async deleteDocument(docId: string) {
    return this.client.delete(
      {
        index: indexConfig.document.index,
        id: docId,
      },
      { ignore: [404] },
    );
  }

  async deleteProject(projectId: string) {
    return this.client.delete(
      {
        index: indexConfig.project.index,
        id: projectId,
      },
      { ignore: [404] },
    );
  }

  async deleteConversationMessage(messageId: string) {
    return this.client.delete(
      {
        index: indexConfig.conversationMessage.index,
        id: messageId,
      },
      { ignore: [404] },
    );
  }

  async deleteSkill(skillId: string) {
    return this.client.delete(
      {
        index: indexConfig.skill.index,
        id: skillId,
      },
      { ignore: [404] },
    );
  }

  async searchResources(user: User, req: SearchRequest) {
    const { query, limit, entities } = req;
    const { body } = await this.client.search<SearchResponse<ResourceDocument>>({
      index: indexConfig.resource.index,
      body: {
        query: {
          bool: {
            must: [
              { match: { uid: user.uid } },
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content'],
                  type: 'most_fields',
                },
              },
            ],
            ...(entities?.length > 0 && {
              filter: [{ terms: { _id: entities.map((entity) => entity.entityId) } }],
            }),
          },
        },
        size: limit,
        highlight: {
          fields: {
            title: {},
            content: {},
          },
        },
      },
    });

    return body.hits.hits;
  }

  async searchDocuments(user: User, req: SearchRequest) {
    const { query, limit, entities } = req;
    const { body } = await this.client.search<SearchResponse<DocumentDocument>>({
      index: indexConfig.document.index,
      body: {
        query: {
          bool: {
            must: [
              { match: { uid: user.uid } },
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content'],
                  type: 'most_fields',
                },
              },
            ],
            ...(entities?.length > 0 && {
              filter: [{ terms: { _id: entities.map((entity) => entity.entityId) } }],
            }),
          },
        },
        size: limit,
        highlight: {
          fields: {
            title: {},
            content: {},
          },
        },
      },
    });

    return body.hits.hits;
  }

  async searchProjects(user: User, req: SearchRequest) {
    const { query, limit, entities } = req;
    const { body } = await this.client.search<SearchResponse<ProjectDocument>>({
      index: indexConfig.project.index,
      body: {
        query: {
          bool: {
            must: [
              { match: { uid: user.uid } },
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'description'],
                  type: 'most_fields',
                },
              },
            ],
            ...(entities?.length > 0 && {
              filter: [{ terms: { _id: entities.map((entity) => entity.entityId) } }],
            }),
          },
        },
        size: limit,
        highlight: {
          fields: {
            title: {},
            description: {},
          },
        },
      },
    });

    return body.hits.hits;
  }

  async searchConversationMessages(user: User, req: SearchRequest) {
    const { query, limit } = req;
    const { body } = await this.client.search<SearchResponse<ConversationMessageDocument>>({
      index: indexConfig.conversationMessage.index,
      body: {
        query: {
          bool: {
            must: [
              { match: { uid: user.uid } },
              {
                multi_match: {
                  query,
                  fields: ['convTitle^2', 'content'],
                  type: 'most_fields',
                },
              },
            ],
          },
        },
        size: limit,
        highlight: {
          fields: {
            convTitle: {},
            content: {},
          },
        },
      },
    });

    return body.hits.hits;
  }

  async searchSkills(user: User, req: SearchRequest) {
    const { query, limit } = req;
    const { body } = await this.client.search<SearchResponse<SkillDocument>>({
      index: indexConfig.skill.index,
      body: {
        query: {
          bool: {
            must: [
              { match: { uid: user.uid } },
              {
                multi_match: {
                  query,
                  fields: ['displayName^2', 'description', 'tplName'],
                  type: 'most_fields',
                },
              },
            ],
          },
        },
        size: limit,
        highlight: {
          fields: {
            displayName: {},
            description: {},
          },
        },
      },
    });

    return body.hits.hits;
  }
}
