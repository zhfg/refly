import {
  ActionResult,
  SkillContext,
  SkillContextContentItem,
  SkillContextDocumentItem,
  SkillContextResourceItem,
} from '@refly/openapi-schema';
import { Node, Edge } from '@xyflow/react';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { genUniqueId } from '@refly-packages/utils/id';
import { getClientOrigin } from '@refly-packages/utils/url';

export const convertContextToItems = (context?: SkillContext, history?: ActionResult[]): NodeItem[] => {
  if (!context) return [];

  const items: NodeItem[] = [];

  history?.forEach((item) => {
    items.push({
      id: genUniqueId(),
      position: { x: 0, y: 0 },
      type: 'skillResponse',
      data: {
        entityId: item.resultId,
        contentPreview: item.steps?.map((step) => step.content)?.join('\n\n'),
        title: item.title,
      },
    });
  });

  // Convert contentList
  context?.contentList?.forEach((content: SkillContextContentItem) => {
    const metadata = content.metadata as any;
    items.push({
      id: metadata?.nodeId ?? genUniqueId(),
      type: metadata?.domain?.includes('resource')
        ? 'resource'
        : metadata?.domain?.includes('document')
          ? 'document'
          : 'skillResponse',
      position: { x: 0, y: 0 },
      data: {
        entityId: metadata?.entityId ?? '',
        title: metadata?.title ?? 'Selected Content',
        metadata: {
          contentPreview: content.content,
          selectedContent: content.content,
          sourceEntityId: metadata?.entityId ?? '',
          sourceEntityType: metadata?.domain?.split('Selection')[0] ?? '',
          sourceType: metadata?.domain ?? '',
          ...(metadata?.url && { url: metadata.url }),
        },
      },
    });
  });

  // Convert resources
  context?.resources?.forEach((resource: SkillContextResourceItem) => {
    items.push({
      id: resource.metadata?.nodeId ?? genUniqueId(),
      type: 'resource',
      position: { x: 0, y: 0 },
      data: {
        entityId: resource.resourceId ?? '',
        title: resource.resource?.title ?? 'Resource',
        metadata: resource.metadata ?? {},
      },
      isPreview: resource.isCurrent ? true : false,
      isCurrentContext: resource.isCurrent,
    });
  });

  // Convert documents
  context?.documents?.forEach((doc: SkillContextDocumentItem) => {
    items.push({
      id: doc.metadata?.nodeId ?? genUniqueId(),
      type: 'document',
      position: { x: 0, y: 0 },
      data: {
        entityId: doc.docId ?? '',
        title: doc.document?.title ?? 'Document',
        metadata: doc.metadata ?? {},
      },
      isPreview: doc.isCurrent ? true : false,
      isCurrentContext: doc.isCurrent,
    });
  });

  return items;
};

export const convertContextItemsToInvokeParams = (
  items: NodeItem[],
): { context: SkillContext; resultHistory: ActionResult[] } => {
  const context = {
    contentList: items
      ?.filter((item) => item?.data?.metadata?.sourceType?.includes('Selection'))
      ?.map((item) => ({
        content: item.data?.metadata?.selectedContent ?? '',
        metadata: {
          domain: item.data?.metadata?.sourceType ?? '',
          entityId: item.data?.entityId ?? '',
          title: item.data?.title ?? '',
          nodeId: item.id,
          ...(item.data?.metadata?.sourceType === 'extensionWeblinkSelection' && {
            url: item.data?.metadata?.url || getClientOrigin(),
          }),
        },
      })),
    resources: items
      ?.filter((item) => item.type === 'resource' && !item.data?.metadata?.sourceType?.includes('Selection'))
      .map((item) => ({
        resourceId: item.data?.entityId || item.id,
        resource: {
          resourceId: item.data?.entityId,
          resourceType: item.data?.metadata?.resourceType,
          title: item.data?.title,
        },
        isCurrent: item.isCurrentContext,
        metadata: {
          ...item.data?.metadata,
          nodeId: item.id,
        },
      })),
    documents: items
      ?.filter((item) => item.type === 'document' && !item.data?.metadata?.sourceType?.includes('Selection'))
      .map((item) => ({
        docId: item.data?.entityId || item.id,
        document: {
          docId: item.data?.entityId,
          title: item.data?.title,
        },
        isCurrent: item.isCurrentContext,
        metadata: {
          ...item.data?.metadata,
          nodeId: item.id,
          url: getClientOrigin(),
        },
      })),
  };
  const resultHistory = items
    ?.filter((item) => item.type === 'skillResponse')
    .map((item) => ({
      resultId: item.data?.entityId,
      title: item.data?.title,
    }));

  return { context, resultHistory };
};

export const convertContextItemsToEdges = (
  resultId: string,
  items: NodeItem[],
  nodes?: Node[],
  edges?: Edge[],
): { edgesToAdd: Edge[]; edgesToDelete: Edge[] } => {
  // Initialize arrays for new edges and edges to be deleted
  const edgesToAdd: Edge[] = [];
  const edgesToDelete = edges ?? [];

  // Return early if no items to process
  if (!items?.length) {
    return { edgesToAdd, edgesToDelete };
  }

  const currentNode = nodes.find((node) => node.data?.entityId === resultId);
  if (!currentNode) {
    console.warn('currentNode not found');
    return { edgesToAdd, edgesToDelete };
  }

  const relatedEdges = edges.filter((edge) => edge.target === currentNode.id) ?? [];

  // Create a map of source entity IDs to their corresponding node IDs
  const entityNodeMap = new Map<string, string>();
  nodes?.forEach((node) => {
    if (node.data?.entityId) {
      entityNodeMap.set(node.data.entityId as string, node.id);
    }
  });

  const itemNodeIds = items.map((item) => entityNodeMap.get(item.data?.entityId as string));
  const itemNodeIdSet = new Set(itemNodeIds);

  const edgeSourceIds = relatedEdges.map((edge) => edge.source);
  const edgeSourceIdSet = new Set(edgeSourceIds);

  // Process each item to create edges based on relationships
  items.forEach((item) => {
    const itemNodeId = entityNodeMap.get(item.data?.entityId as string);
    if (!edgeSourceIdSet.has(itemNodeId)) {
      const newEdge: Edge = {
        id: `${itemNodeId}-${currentNode.id}`,
        source: itemNodeId,
        target: currentNode.id,
      };
      edgesToAdd.push(newEdge);
    }
  });

  // Delete edges that are no longer part of the context items
  relatedEdges.forEach((edge) => {
    if (!itemNodeIdSet.has(edge.source)) {
      edgesToDelete.push(edge);
    }
  });

  return {
    edgesToAdd,
    edgesToDelete,
  };
};
