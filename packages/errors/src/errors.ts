import { BaseError } from './base';

export class UnknownError extends BaseError {
  code = 'E0000';
  messageDict = {
    en: 'Unknown error, please contact the Refly team',
    zh: '未知错误，请联系 Refly 团队',
  };
}

export class CollectionNotFoundError extends BaseError {
  code = 'E0001';
  messageDict = {
    en: 'Collection not found',
    zh: '知识库不存在',
  };
}

export class ResourceNotFoundError extends BaseError {
  code = 'E0002';
  messageDict = {
    en: 'Resource not found',
    zh: '资源不存在',
  };
}

export class NoteNotFoundError extends BaseError {
  code = 'E0003';
  messageDict = {
    en: 'Note not found',
    zh: '笔记不存在',
  };
}

export class OutOfStorageQuotaError extends BaseError {
  code = 'E1001';
  messageDict = {
    en: 'Out of storage quota. Please upgrade your subscription',
    zh: '超出存储限额，请升级订阅套餐',
  };
}

export class OutOfTokenQuotaError extends BaseError {
  code = 'E1002';
  messageDict = {
    en: 'Out of token quota. Please upgrade your subscription',
    zh: '超出 token 限额，请升级订阅套餐',
  };
}
