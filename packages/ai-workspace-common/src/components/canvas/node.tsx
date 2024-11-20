import { Handle, Node, NodeProps, NodeTypes, Position } from '@xyflow/react';
import { v4 as UUIDV4 } from 'uuid';
import { CanvasNodeType } from '@refly/openapi-schema';

export type CanvasNodeData<CanvasMeta extends Record<string, unknown> = Record<string, unknown>> = {
  entityId: string;
  metadata: CanvasMeta;
};

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;

export type DocumentNodeMeta = {
  contentPreview: string;
};
type DocumentNode = Node<CanvasNodeData<DocumentNodeMeta>, 'document'>;

export const DocumentNode = ({ data, selected }: NodeProps<DocumentNode>) => {
  return (
    <div className={`bg-green-100 rounded-lg p-2 shadow-md ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <Handle type="target" position={Position.Left} />
      Document ID: {data.entityId}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export type ResourceNodeMeta = {
  resourceType: string;
};
type ResourceNode = Node<CanvasNodeData<ResourceNodeMeta>, 'resource'>;

export const ResourceNode = ({ data, selected }: NodeProps<ResourceNode>) => {
  return (
    <div className={`bg-blue-100 rounded-lg p-2 shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Left} />
      Resource ID: {data.entityId}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export type SkillNodeMeta = {
  query: string;
};
type SkillNode = Node<CanvasNodeData<SkillNodeMeta>, 'skill'>;

export const SkillNode = ({ data, selected }: NodeProps<SkillNode>) => {
  return (
    <div className={`bg-yellow-100 rounded-lg p-2 shadow-md ${selected ? 'ring-2 ring-yellow-500' : ''}`}>
      <Handle type="target" position={Position.Left} />
      Skill ID: {data.entityId}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export type ToolNodeMeta = {
  toolType: string;
};
type ToolNode = Node<CanvasNodeData<ToolNodeMeta>, 'tool'>;

export const ToolNode = ({ data, selected }: NodeProps<ToolNode>) => {
  return (
    <div className={`bg-red-100 rounded-lg p-2 shadow-md ${selected ? 'ring-2 ring-red-500' : ''}`}>
      <Handle type="target" position={Position.Left} />
      Tool ID: {data.entityId}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export type ResponseNodeMeta = {
  modelName?: string;
};
type ResponseNode = Node<CanvasNodeData<ResponseNodeMeta>, 'response'>;

export const ResponseNode = ({ data, selected }: NodeProps<ResponseNode>) => {
  return (
    <div className={`bg-purple-100 rounded-lg p-2 shadow-md ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <Handle type="target" position={Position.Left} />
      Response ID: {data.entityId}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export const nodeTypes: NodeTypes = {
  document: DocumentNode,
  resource: ResourceNode,
  skill: SkillNode,
  tool: ToolNode,
  response: ResponseNode,
};

type NodeMetadataMap = {
  document: DocumentNodeMeta;
  resource: ResourceNodeMeta;
  skill: SkillNodeMeta;
  tool: ToolNodeMeta;
} & Record<string, Record<string, unknown>>;

export const prepareNodeData = <T extends CanvasNodeType>(param: {
  type: T;
  data: CanvasNodeData<NodeMetadataMap[T]>;
}): Node<CanvasNodeData<NodeMetadataMap[T]>, T> => {
  return {
    id: `node-${UUIDV4()}`,
    type: param.type,
    position: { x: 0, y: 0 },
    data: param.data,
  };
};
