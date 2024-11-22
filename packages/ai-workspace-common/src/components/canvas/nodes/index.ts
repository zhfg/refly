import { NodeTypes } from '@xyflow/react';
import { v4 as UUIDV4 } from 'uuid';
import { CanvasNodeType } from '@refly/openapi-schema';
import { DocumentNode } from './document';
import { ResourceNode } from './resource';
import { SkillNode } from './skill';
import { ToolNode } from './tool';
import { ResponseNode } from './response';
import { NodeMetadataMap, CanvasNodeData } from './types';

// Export all components and types
export * from './types';
export * from './document';
export * from './resource';
export * from './skill';
export * from './tool';
export * from './response';

// Node types mapping
export const nodeTypes: NodeTypes = {
  document: DocumentNode,
  resource: ResourceNode,
  skill: SkillNode,
  tool: ToolNode,
  response: ResponseNode,
};

// Helper function to prepare node data
export const prepareNodeData = <T extends CanvasNodeType>(param: {
  type: T;
  data: CanvasNodeData<NodeMetadataMap[T]>;
}) => {
  return {
    id: `node-${UUIDV4()}`,
    type: param.type,
    position: { x: 0, y: 0 },
    data: param.data,
  };
};
