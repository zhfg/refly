import { Source } from '@refly/openapi-schema';

export type MarkScope = 'block' | 'inline';

export type TextType = 'text' | 'table' | 'link' | 'image' | 'video' | 'audio';

export interface Mark {
  type: TextType; // 内容类型
  data: string;
  target?: HTMLElement;
  xPath: string; // 该元素对应的 xPath 路径，这个可以当做唯一 id
  scope: MarkScope; // 是块级还是内联元素
}

export interface Selection {
  xPath: string;
  content: string;
  type: TextType;
}

export interface Data {
  version: string; // 浏览器插件所属的版本，方便制定兼容策略
  type: 'partial-content' | 'whole-content' | 'link'; // 是前端全部内容、部分内容、还是直接通过 link 处理
  source: Source; // 网页 Meta
  marks: Mark[];
  userId: string; // 是否需要 by User 保存，到时候可以推荐给其他人是这个人的策略
}

export type SyncMarkEventType = 'add' | 'remove' | 'reset';

export interface SyncMarkEvent {
  name: 'syncMarkEvent' | 'syncMarkEventBack';
  body: {
    type: SyncMarkEventType;
    mark?: Mark;
  };
}

export type SyncStatusEventType = 'start' | 'update' | 'stop' | 'reset';

export interface SyncStatusEvent {
  name: 'syncStatusEvent';
  body: {
    type: SyncStatusEventType;
    scope: MarkScope;
    enableMultiSelect?: boolean;
    showContentSelector?: boolean;
  };
}
