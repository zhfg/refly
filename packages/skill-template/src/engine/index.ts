import { SkillRunnableConfig } from '../base';
import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai';
import { Document, DocumentInterface } from '@langchain/core/documents';
import {
  CreateCollectionResponse,
  CreateLabelClassRequest,
  CreateLabelClassResponse,
  CreateLabelInstanceRequest,
  CreateLabelInstanceResponse,
  CreateResourceResponse,
  GetResourceDetailResponse,
  SearchRequest,
  SearchResponse,
  UpdateCollectionResponse,
  UpdateResourceResponse,
  UpsertCollectionRequest,
  UpsertResourceRequest,
  User,
  GetNoteDetailResponse,
  UpsertNoteRequest,
  CreateNoteResponse,
  ListNotesData,
  ListNotesResponse,
  ResourceType,
  InMemoryIndexContentResponse,
  InMemorySearchResponse,
  SearchOptions,
  WebSearchRequest,
  WebSearchResponse,
} from '@refly/openapi-schema';

// TODO: unify with frontend
export type ContentNodeType =
  | 'resource'
  | 'note'
  | 'extensionWeblink'
  | 'resourceSelection'
  | 'collectionSelection'
  | 'noteSelection';

export interface NodeMeta {
  title: string;
  nodeType: ContentNodeType;
  url?: string;
  noteId?: string;
  resourceId?: string;
  resourceType?: ResourceType;
  [key: string]: any; // any other fields
}

export interface ReflyService {
  getNoteDetail: (user: User, noteId: string) => Promise<GetNoteDetailResponse>;
  createNote: (user: User, req: UpsertNoteRequest) => Promise<CreateNoteResponse>;
  listNotes: (user: User, param: ListNotesData['query']) => Promise<ListNotesResponse>;
  getResourceDetail: (user: User, req: { resourceId: string }) => Promise<GetResourceDetailResponse>;
  createResource: (user: User, req: UpsertResourceRequest) => Promise<CreateResourceResponse>;
  updateResource: (user: User, req: UpsertResourceRequest) => Promise<UpdateResourceResponse>;
  createCollection: (user: User, req: UpsertCollectionRequest) => Promise<CreateCollectionResponse>;
  updateCollection: (user: User, req: UpsertCollectionRequest) => Promise<UpdateCollectionResponse>;
  createLabelClass: (user: User, req: CreateLabelClassRequest) => Promise<CreateLabelClassResponse>;
  createLabelInstance: (user: User, req: CreateLabelInstanceRequest) => Promise<CreateLabelInstanceResponse>;
  webSearch: (user: User, req: WebSearchRequest) => Promise<WebSearchResponse>;
  search: (user: User, req: SearchRequest, options?: SearchOptions) => Promise<SearchResponse>;
  inMemoryIndexContent: (
    user: User,
    req: { doc: Document<NodeMeta>; needChunk: boolean },
  ) => Promise<InMemoryIndexContentResponse>;
  inMemoryIndexDocuments: (user: User, req: { docs: Document<NodeMeta>[] }) => Promise<InMemoryIndexContentResponse>;
  inMemorySearch: (
    user: User,
    req: { query: string; filter: (doc: Document<NodeMeta>) => boolean; k: number },
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
