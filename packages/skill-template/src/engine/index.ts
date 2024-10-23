import { SkillRunnableConfig } from '../base';
import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import {
  CreateLabelClassRequest,
  CreateLabelClassResponse,
  CreateLabelInstanceRequest,
  CreateLabelInstanceResponse,
  CreateResourceResponse,
  GetResourceDetailResponse,
  SearchRequest,
  SearchResponse,
  UpdateResourceResponse,
  UpsertResourceRequest,
  User,
  GetCanvasDetailResponse,
  UpsertCanvasRequest,
  CreateCanvasResponse,
  ResourceType,
  InMemorySearchResponse,
  SearchOptions,
  WebSearchRequest,
  WebSearchResponse,
  ListCanvasData,
  ListCanvasResponse,
  UpsertProjectRequest,
  CreateProjectResponse,
  UpdateProjectResponse,
  AddReferencesRequest,
  AddReferencesResponse,
  DeleteReferencesRequest,
  DeleteReferencesResponse,
} from '@refly-packages/openapi-schema';

// TODO: unify with frontend
export type ContentNodeType = 'resource' | 'canvas' | 'extensionWeblink' | 'resourceSelection' | 'canvasSelection';

export interface NodeMeta {
  title: string;
  nodeType: ContentNodeType;
  url?: string;
  canvasId?: string;
  resourceId?: string;
  resourceType?: ResourceType;
  [key: string]: any; // any other fields
}

export interface ReflyService {
  getCanvasDetail: (user: User, canvasId: string) => Promise<GetCanvasDetailResponse>;
  createCanvas: (user: User, req: UpsertCanvasRequest) => Promise<CreateCanvasResponse>;
  listCanvas: (user: User, param: ListCanvasData['query']) => Promise<ListCanvasResponse>;
  getResourceDetail: (user: User, req: { resourceId: string }) => Promise<GetResourceDetailResponse>;
  createResource: (user: User, req: UpsertResourceRequest) => Promise<CreateResourceResponse>;
  updateResource: (user: User, req: UpsertResourceRequest) => Promise<UpdateResourceResponse>;
  createProject: (user: User, req: UpsertProjectRequest) => Promise<CreateProjectResponse>;
  updateProject: (user: User, req: UpsertProjectRequest) => Promise<UpdateProjectResponse>;
  createLabelClass: (user: User, req: CreateLabelClassRequest) => Promise<CreateLabelClassResponse>;
  createLabelInstance: (user: User, req: CreateLabelInstanceRequest) => Promise<CreateLabelInstanceResponse>;
  webSearch: (user: User, req: WebSearchRequest) => Promise<WebSearchResponse>;
  search: (user: User, req: SearchRequest, options?: SearchOptions) => Promise<SearchResponse>;
  addReferences: (user: User, req: AddReferencesRequest) => Promise<AddReferencesResponse>;
  deleteReferences: (user: User, req: DeleteReferencesRequest) => Promise<DeleteReferencesResponse>;
  inMemorySearchWithIndexing: (
    user: User,
    options: {
      content: string | Document<any> | Array<Document<any>>;
      query?: string;
      k?: number;
      filter?: (doc: Document<NodeMeta>) => boolean;
      needChunk?: boolean;
      additionalMetadata?: Record<string, any>;
    },
  ) => Promise<InMemorySearchResponse>;
}

export interface SkillEngineOptions {
  defaultModel?: string;
}

export interface Logger {
  /**
   * Write an 'error' level log.
   */
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
}

export class SkillEngine {
  private config: SkillRunnableConfig;

  constructor(public logger: Logger, public service: ReflyService, private options?: SkillEngineOptions) {
    this.options = {
      defaultModel: 'openai/gpt-4o-mini',
      ...options,
    };
  }

  configure(config: SkillRunnableConfig) {
    this.config = config;
  }

  chatModel(params?: Partial<OpenAIChatInput>): ChatOpenAI {
    return new ChatOpenAI({
      model: this.config?.configurable?.modelName || this.options.defaultModel,
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      configuration: { baseURL: process.env.OPENROUTER_API_KEY && 'https://openrouter.ai/api/v1' },
      ...params,
    });
  }
}
