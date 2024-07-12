import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai';
import {
  CreateCollectionResponse,
  CreateResourceResponse,
  UpdateCollectionResponse,
  UpdateResourceResponse,
  UpsertCollectionRequest,
  UpsertResourceRequest,
} from '@refly/openapi-schema';

interface User {
  uid: string;
}

export interface ReflyService {
  createResource: (user: User, req: UpsertResourceRequest) => Promise<CreateResourceResponse | null>;
  updateResource: (user: User, req: UpsertResourceRequest) => Promise<UpdateResourceResponse | null>;
  createCollection: (user: User, req: UpsertCollectionRequest) => Promise<CreateCollectionResponse | null>;
  updateCollection: (user: User, req: UpsertCollectionRequest) => Promise<UpdateCollectionResponse | null>;
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
  constructor(public logger: Logger, public service: ReflyService, private options?: SkillEngineOptions) {
    this.options = {
      defaultModel: 'gpt-3.5-turbo',
      ...options,
    };
  }

  chatModel(params?: Partial<OpenAIChatInput>): ChatOpenAI {
    return new ChatOpenAI({
      model: this.options.defaultModel,
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
      ...params,
    });
  }
}
