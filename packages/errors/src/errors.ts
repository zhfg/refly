import { BaseError } from './base';

export class UnknownError extends BaseError {
  code = 'E0000';
  messageDict = {
    en: 'Unknown error, please contact the Refly team',
    zh: '未知错误，请联系 Refly 团队',
  };
}

export class ParamsError extends BaseError {
  code = 'E1001';
  messageDict = {
    en: 'Invalid params, please contact the Refly team',
    zh: '参数错误，请联系 Refly 团队',
  };
}

export class ProjectNotFoundError extends BaseError {
  code = 'E1000';
  messageDict = {
    en: 'Project not found, please refresh',
    zh: '项目不存在，请刷新重试',
  };
}

export class ResourceNotFoundError extends BaseError {
  code = 'E1002';
  messageDict = {
    en: 'Resource not found, please refresh',
    zh: '资源不存在，请刷新重试',
  };
}

export class CanvasNotFoundError extends BaseError {
  code = 'E1003';
  messageDict = {
    en: 'Canvas not found, please refresh',
    zh: '稿布不存在，请刷新重试',
  };
}

export class ReferenceNotFoundError extends BaseError {
  code = 'E1004';
  messageDict = {
    en: 'Reference not found, please refresh',
    zh: '引用不存在，请刷新重试',
  };
}

export class ReferenceObjectMissingError extends BaseError {
  code = 'E1005';
  messageDict = {
    en: 'Reference object missing, please refresh',
    zh: '引用对象不存在，请刷新重试',
  };
}

export class SkillNotFoundError extends BaseError {
  code = 'E1006';
  messageDict = {
    en: 'Skill not found, please refresh',
    zh: '技能不存在，请刷新重试',
  };
}

export class LabelClassNotFoundError extends BaseError {
  code = 'E1007';
  messageDict = {
    en: 'Label class not found, please refresh',
    zh: '标签分类不存在，请刷新重试',
  };
}

export class LabelInstanceNotFoundError extends BaseError {
  code = 'E1008';
  messageDict = {
    en: 'Label instance not found, please refresh',
    zh: '标签不存在，请刷新重试',
  };
}

export class ShareNotFoundError extends BaseError {
  code = 'E1009';
  messageDict = {
    en: 'Share content not found',
    zh: '分享内容不存在',
  };
}

export class ConversationNotFoundError extends BaseError {
  code = 'E1010';
  messageDict = {
    en: 'Thread not found',
    zh: '会话不存在',
  };
}

export class StorageQuotaExceeded extends BaseError {
  code = 'E2001';
  messageDict = {
    en: 'Storage quota exceeded, please upgrade your subscription',
    zh: '存储容量不足，请升级订阅套餐',
  };
}

export class ModelUsageQuotaExceeded extends BaseError {
  code = 'E2002';
  messageDict = {
    en: 'Model usage quota exceeded, please upgrade your subscription',
    zh: '模型使用额度不足，请升级订阅套餐',
  };
}

export class ModelNotSupportedError extends BaseError {
  code = 'E2003';
  messageDict = {
    en: 'Model not supported, please select other models',
    zh: '不支持当前模型，请选择其他模型',
  };
}
