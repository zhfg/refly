import { ChatMessage, ChatTaskType, MessageType, SkillInstance, Source } from '@refly/openapi-schema';
import type { RelatedQuestion } from './session';

export type MessageState = {
  nowInvokeSkillId?: string;
  pendingMsg?: string;
  pendingFirstToken?: boolean; // 是否正在准备生成，如果收到第一个字符，即代表已经开始生生成
  pending?: boolean;
  error?: boolean; // 此次信息是否出错，比如还没开始生成就 abort，显示错误信息
  pendingReplyMsg?: ChatMessage | null; // 即将生成的 replyMsg 对象
  history?: [string, string][];
  pendingSourceDocs?: Source[];
  pendingRelatedQuestions?: RelatedQuestion[];
};

/**
 * 前端系统配置，可能是获取的在线配置
 */
export const enum SystemMessageType {
  RECOMMEND_QUESTION = 'recommendQuestion', // 比如提示的三个问题 1. 用简单的语言解释复杂的概念、集思广益前所未有的想法、立即获得朗朗上口的标题 等
  RECOMMEND_OPERATION = 'recommendOperation', // 推荐的操作，比如推荐好友、去 Chrome 商店给五星好评、发推特
}

/**
 *  聊天消息相关
 */

export const enum MessageItemType {
  REPLY = 'reply',
  INTENT = 'intent',
  QUESTION = 'question',

  // 状态消息
  ERROR = 'error',
}

export const enum MessageDataType {
  SELECTION = 'selection',
  TEXT = 'text',
}

export const enum ReplyType {
  WELCOME = 'welcome', // 初始新会话的欢迎回复
  QUESTION = 'question', // 对某个问题的回复
  INTENT = 'intent', // 对某段选中意图的文本进行回复
}

export const enum QuestionType {
  INTENT = 'intent', // 基于某段选中意图进行提问
  NORMAL = 'normal', // 正常提问
}

/**
 * 不会生成会话保存的场景：
 * 1. 如果用户只进行 quickAction，不点继续聊天，那么不会生成会话保存
 * 2. 如果用户新建会话，不继续聊天，不会生产会话保存
 * 3.
 */
// export interface Message {
//   type: MessageType
//   text?: string
//   title?: string
//   question?: string
// }
