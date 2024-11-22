import { NodeTypes } from '@xyflow/react';
import { v4 as UUIDV4 } from 'uuid';
import { CanvasNodeType } from '@refly/openapi-schema';
import { DocumentNode } from './document';
import { ResourceNode } from './resource';
import { SkillNode } from './skill';
import { ToolNode } from './tool';
import { ResponseNode } from './response';
import {
  NodeMetadataMap,
  CanvasNodeData,
  DocumentNodeMeta,
  ResourceNodeMeta,
  SkillNodeMeta,
  ToolNodeMeta,
  ResponseNodeMeta,
} from './types';

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

// Helper function to get default metadata based on node type
export const getNodeDefaultMetadata = (nodeType: CanvasNodeType) => {
  if (!nodeType) {
    return {};
  }

  switch (nodeType) {
    case 'document':
      return {
        contentPreview: 'Loading document content...',
        // Add optional fields with default values
        title: '',
        lastModified: new Date().toISOString(),
      } as DocumentNodeMeta;

    case 'resource':
      return {
        resourceType: 'weblink', // Default to weblink
        url: '',
        description: '',
        lastAccessed: new Date().toISOString(),
      } as ResourceNodeMeta;

    case 'skill':
      return {
        query: '',
        skillType: 'prompt',
        model: 'gpt-4',
        parameters: {}, // Additional parameters if needed
        lastExecuted: null,
      } as SkillNodeMeta;

    case 'tool':
      return {
        toolType: 'TextToSpeech',
        configuration: {}, // Tool-specific configuration
        status: 'ready',
        lastUsed: null,
      } as ToolNodeMeta;

    case 'response':
      return {
        modelName: 'AI Assistant',
        timestamp: new Date().toISOString(),
        status: 'pending',
        executionTime: null,
      } as ResponseNodeMeta;

    default:
      return {};
  }
};
