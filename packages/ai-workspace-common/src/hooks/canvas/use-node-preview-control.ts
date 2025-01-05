import { useCallback } from 'react';
import { useCanvasStore, useCanvasStoreShallow } from '../../stores/canvas';
import { CanvasNode } from '../../components/canvas/nodes';
import { addPinnedNodeEmitter } from '../../events/addPinnedNode';

interface UseNodePreviewControlOptions {
  canvasId: string;
}

interface NodePreviewControl {
  clickToPreview: boolean;
  nodePreviews: CanvasNode[];
  toggleClickToPreview: () => void;
  previewNode: (node: CanvasNode) => void;
  closeNodePreview: (node: CanvasNode) => void;
  pinNode: (node: CanvasNode) => void;
  unpinNode: (node: CanvasNode) => void;
  isNodePinned: (nodeId: string) => boolean;
  clearPinnedNodes: () => void;
  handleNodePreview: (node: CanvasNode) => boolean;
}

export const useNodePreviewControl = ({ canvasId }: UseNodePreviewControlOptions): NodePreviewControl => {
  const { clickToPreview, setClickToPreview, addNodePreview, setNodePreview, removeNodePreview, nodePreviews } =
    useCanvasStoreShallow((state) => ({
      clickToPreview: state.clickToPreview,
      setClickToPreview: state.setClickToPreview,
      addNodePreview: state.addNodePreview,
      setNodePreview: state.setNodePreview,
      removeNodePreview: state.removeNodePreview,
      nodePreviews: state.config[canvasId]?.nodePreviews || [],
    }));

  /**
   * Toggle click-to-preview functionality
   */
  const toggleClickToPreview = useCallback(() => {
    setClickToPreview(!clickToPreview);
  }, [clickToPreview, setClickToPreview]);

  /**
   * Pin a node for preview
   */
  const previewNode = useCallback(
    (node: CanvasNode) => {
      addNodePreview(canvasId, node);
    },
    [canvasId, addNodePreview],
  );

  const closeNodePreview = useCallback(
    (node: CanvasNode) => {
      removeNodePreview(canvasId, node.id);
    },
    [canvasId, removeNodePreview],
  );

  const pinNode = useCallback(
    (node: CanvasNode) => {
      setNodePreview(canvasId, { ...node, isPinned: true });
      addPinnedNodeEmitter.emit('addPinnedNode', { id: node.id, canvasId });
    },
    [canvasId, setNodePreview],
  );

  /**
   * Unpin a node from preview
   */
  const unpinNode = useCallback(
    (node: CanvasNode) => {
      setNodePreview(canvasId, { ...node, isPinned: false });
    },
    [canvasId, setNodePreview],
  );

  /**
   * Check if a node is pinned
   */
  const isNodePinned = useCallback(
    (nodeId: string) => {
      const { config } = useCanvasStore.getState();
      const nodePreviews = config[canvasId]?.nodePreviews || [];
      return nodePreviews.some((n) => n.id === nodeId && n.isPinned);
    },
    [canvasId],
  );

  /**
   * Clear all pinned nodes
   */
  const clearPinnedNodes = useCallback(() => {
    nodePreviews.forEach((node) => {
      removeNodePreview(canvasId, node.id);
    });
  }, [canvasId, nodePreviews, removeNodePreview]);

  /**
   * Handle node click with preview logic
   */
  const handleNodePreview = useCallback(
    (node: CanvasNode) => {
      if (!clickToPreview) {
        return false;
      }
      addNodePreview(canvasId, node);
      return true;
    },
    [canvasId, clickToPreview, addNodePreview],
  );

  return {
    // State
    clickToPreview,
    nodePreviews,

    // Actions
    toggleClickToPreview,
    previewNode,
    closeNodePreview,
    pinNode,
    unpinNode,
    isNodePinned,
    clearPinnedNodes,
    handleNodePreview,
  };
};
