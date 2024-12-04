import { Node, NodeProps } from '@xyflow/react';
import { ActionMeta, ActionStatus, ActionStep, CanvasNodeType } from '@refly/openapi-schema';

export type CanvasNodeData<T = Record<string, unknown>> = {
  title: string;
  entityId: string;
  createdAt?: string;
  contentPreview?: string | React.ReactNode;
  metadata?: T;
  targetHandle?: string;
  sourceHandle?: string;
};

export type CanvasNode<T = Record<string, unknown>> = Node<CanvasNodeData<T>, CanvasNodeType>;

// Node specific metadata types
export type DocumentNodeMeta = {
  status: ActionStatus;
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
  status: ActionStatus;
  modelName?: string;
  actionMeta?: ActionMeta;
  steps?: ActionStep[];
};

// Type mapping for node metadata
export type NodeMetadataMap = {
  document: DocumentNodeMeta;
  resource: ResourceNodeMeta;
  skill: SkillNodeMeta;
  tool: ToolNodeMeta;
  response: ResponseNodeMeta;
} & Record<string, Record<string, unknown>>;

// Add new common props interface
export interface CommonNodeProps {
  isPreview?: boolean; // Control preview mode
  hideActions?: boolean; // Control action buttons visibility
  hideHandles?: boolean; // Control handles visibility
  onNodeClick?: () => void; // Optional click handler
}

// Update existing node props
export type DocumentNodeProps = NodeProps<Node<CanvasNodeData<DocumentNodeMeta>, 'document'>> & CommonNodeProps;
export type ResourceNodeProps = NodeProps<Node<CanvasNodeData<ResourceNodeMeta>, 'resource'>> & CommonNodeProps;
export type SkillResponseNodeProps = NodeProps<Node<CanvasNodeData<ResponseNodeMeta>, 'skillResponse'>> &
  CommonNodeProps;
