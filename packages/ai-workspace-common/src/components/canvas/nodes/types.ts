import { Node } from '@xyflow/react';
import { CanvasNodeType } from '@refly/openapi-schema';

// Base types for all nodes
export type CanvasNodeData<CanvasMeta extends Record<string, unknown> = Record<string, unknown>> = {
  title: string;
  entityId: string;
  metadata?: CanvasMeta;
};

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;

// Node specific metadata types
export type DocumentNodeMeta = {
  contentPreview: string;
};

export type ResourceNodeMeta = {
  resourceType: string;
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
