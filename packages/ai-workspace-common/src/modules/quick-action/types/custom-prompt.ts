/**
 * Model CustomPrompt
 * 自定义prompt模型
 */
export type CustomPrompt = {
  /**
   * id为主键，自动生成，映射到数据库中的_id字段
   */
  id: string;
  /**
   * 类型
   */
  type: PromptActionType;
  /**
   * 提示名称
   */
  title: string;
  /**
   * 提示内容
   */
  content: string;
  /**
   * 作者id
   */
  authorId: string;
  /**
   * 是否置顶
   */
  pinned: boolean;
  /**
   * 是否直接发送给用户
   */
  directSend: boolean;
  /**
   * 图标名称
   */
  iconName: string;
  /**
   * 排序位置
   */
  position: number;
  /**
   * 基于系统prompt创建的自定义prompt
   */
  systemPromptId: string | null;
  /**
   * 系统关键字
   */
  systemKey: string | null;
  /**
   * 创建时间
   */
  createdAt: Date;
  /**
   * 更新时间
   */
  updatedAt: Date;
};

export enum PromptActionType {
  selectionAction = 'selectionAction',
  myPrompt = 'myPrompt',
}
