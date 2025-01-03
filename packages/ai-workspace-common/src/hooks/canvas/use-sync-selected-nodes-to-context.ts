import { useEffect } from 'react';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
export const useSyncSelectedNodesToContext = (
  contextItems: NodeItem[],
  setContextItems: (items: NodeItem[]) => void,
) => {
  const { nodes } = useCanvasData();
  // Add deduplication for selectedContextNodes using Set
  const selectedNodeIds = new Set(
    nodes
      .filter((node) => node.selected && ['resource', 'document', 'skillResponse'].includes(node.type))
      .map((node) => node.id),
  );

  const selectedContextNodes = nodes.filter((node) => selectedNodeIds.has(node.id));

  useEffect(() => {
    // ... rest of the code remains the same ...
    const nonPreviewItems = contextItems.filter((item) => !item.isPreview);
    const existingIds = new Set(nonPreviewItems.map((item) => item.id));

    const newContextItems = [
      ...nonPreviewItems,
      ...selectedContextNodes.filter((node) => !existingIds.has(node.id)).map((node) => ({ ...node, isPreview: true })),
    ];

    setContextItems(newContextItems);
  }, [JSON.stringify([...selectedNodeIds]), setContextItems]);
};
