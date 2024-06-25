import {
  CreateCollectionResponse,
  CreateResourceResponse,
  UpdateCollectionResponse,
  UpdateResourceResponse,
  UpsertCollectionRequest,
  UpsertResourceRequest,
} from '@refly/openapi-schema';

export interface HandlersMap {
  createResource: (req: UpsertResourceRequest) => Promise<CreateResourceResponse>;
  updateResource: (req: UpsertResourceRequest) => Promise<UpdateResourceResponse>;
  createCollection: (req: UpsertCollectionRequest) => Promise<CreateCollectionResponse>;
  updateCollection: (req: UpsertCollectionRequest) => Promise<UpdateCollectionResponse>;
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
  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
}

export interface SKillEngineConstructorParam {
  handlersMap: HandlersMap;
  logger: Logger;
}

class SkillEngine {
  constructor(public logger: Logger, public handlers: HandlersMap) {}
}

export default SkillEngine;
