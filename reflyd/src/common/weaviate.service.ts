import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import weaviate, {
  WeaviateClient,
  ApiKey,
  FusionType,
} from 'weaviate-ts-client';

import {
  ContentDataObj,
  HybridSearchParam,
  SearchResult,
} from './weaviate.dto';

const reflyContentSchema = {
  class: 'Content',
  properties: [
    {
      name: 'url',
      dataType: ['text'],
    },
    {
      name: 'type',
      dataType: ['text'],
    },
    {
      name: 'title',
      dataType: ['text'],
    },
    {
      name: 'content',
      dataType: ['text'],
    },
  ],
  multiTenancyConfig: { enabled: true },
};

@Injectable()
export class WeaviateService implements OnModuleInit {
  private readonly logger = new Logger(WeaviateService.name);
  private client: WeaviateClient;

  constructor(private configService: ConfigService) {
    this.client = weaviate.client({
      scheme: 'https',
      host: this.configService.getOrThrow('vectorStore.host'),
      apiKey: new ApiKey(this.configService.getOrThrow('vectorStore.apiKey')),
    });
  }

  async onModuleInit() {
    await this.ensureCollectionExists();
  }

  async ensureCollectionExists() {
    let classDefinition = await this.client.schema
      .classGetter()
      .withClassName(reflyContentSchema.class)
      .do();

    if (!classDefinition) {
      this.logger.log('class definition not found, create new one');
      classDefinition = await this.client.schema
        .classCreator()
        .withClass(reflyContentSchema)
        .do();
    }

    this.logger.log(
      'collection definition: ' + JSON.stringify(classDefinition, null, 2),
    );
  }

  async batchSaveData(tenantId: string, data: ContentDataObj[]) {
    let batcher = this.client.batch.objectsBatcher();
    for (const obj of data)
      batcher = batcher.withObject({
        class: reflyContentSchema.class,
        properties: {
          url: obj.url,
          type: obj.type,
          title: obj.title,
          content: obj.content,
        },
        id: obj.id,
        vector: obj.vector,
        tenant: tenantId,
      });

    // Flush
    await batcher.do();
  }

  async hybridSearch(param: HybridSearchParam): Promise<SearchResult[]> {
    let getter = this.client.graphql
      .get()
      .withTenant(param.tenantId)
      .withClassName(reflyContentSchema.class)
      .withHybrid({
        query: param.query,
        alpha: 0.5,
        vector: param.vector,
        fusionType: FusionType.rankedFusion,
      })
      .withLimit(param.limit || 5)
      .withFields('url type title content _additional { score explainScore }');

    if (param.filter?.url) {
      getter = getter.withWhere({
        path: ['url'],
        operator: 'Equal',
        valueText: param.filter.url,
      });
    }

    const res = await getter.do();
    this.logger.log('hybrid search result: ' + JSON.stringify(res, null, 2));

    return res.data?.Get?.[reflyContentSchema.class];
  }
}
