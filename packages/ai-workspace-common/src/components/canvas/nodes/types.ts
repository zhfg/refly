import { Node } from '@xyflow/react';
import { CanvasNodeType } from '@refly/openapi-schema';

export type CanvasNodeData<T = Record<string, unknown>> = {
  title: string;
  entityId: string;
  metadata?: T;
  targetHandle?: string;
  sourceHandle?: string;
};

export type CanvasNode<T = Record<string, unknown>> = Node<CanvasNodeData<T>, CanvasNodeType>;

// Node specific metadata types
export type DocumentNodeMeta = {
  contentPreview: string;
};

export type ResourceNodeMeta = {
  resourceType: string;
  contentPreview: string;
};

export type SkillNodeMeta = {
  query: string;
  skillType: 'prompt' | 'prompt-struct' | 'skill' | 'code' | 'http' | string;
  // 如果是 prompt 类型，可能需要额外的模型信息
  model?: string;
};

export type ToolNodeMeta = {
  toolType: string;
};

export type ResponseNodeMeta = {
  modelName?: string;
};

// Type mapping for node metadata
export type NodeMetadataMap = {
  document: DocumentNodeMeta;
  resource: ResourceNodeMeta;
  skill: SkillNodeMeta;
  tool: ToolNodeMeta;
  response: ResponseNodeMeta;
} & Record<string, Record<string, unknown>>;
