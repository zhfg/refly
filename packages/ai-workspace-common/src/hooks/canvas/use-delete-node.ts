import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';

interface DeleteNodeOptions {
  showMessage?: boolean;
}

export const useDeleteNode = () => {
  const { setNodes, setEdges } = useReactFlow();
  const { t } = useTranslation();
  const { canvasId } = useCanvasContext();
  const { handleItemDelete } = useChatHistory();
  const { removeContextItem } = useContextPanelStoreShallow((state) => ({
    removeContextItem: state.removeContextItem,
  }));

  const deleteSingleNode = useCallback(
    (node: CanvasNode<any>, options: DeleteNodeOptions = {}) => {
      const { showMessage = true } = options;

      // Delete node from canvas
      setNodes((nodes) => nodes.filter((n) => n.id !== node.id));

      // Delete connected edges
      setEdges((edges) => edges.filter((e) => e.source !== node.id && e.target !== node.id));

      // Delete node preview from canvas store
      const canvasStore = useCanvasStore.getState();
      canvasStore.removeNodePreview(canvasId, node.id);
      removeContextItem(node.id);

      if (node.type === 'skillResponse') {
        handleItemDelete(node);
      }

      if (showMessage) {
        // Get node title based on node type
        const nodeTitle = node.data?.title ?? t('knowledgeBase.context.untitled');

        // Show success message
        message.success(
          t('knowledgeBase.context.deleteSuccessWithTitle', {
            title: nodeTitle,
            type: t(`knowledgeBase.context.nodeTypes.${node.type}`),
          }),
        );
      }

      return true;
    },
    [setNodes, setEdges, t, handleItemDelete],
  );

  const deleteNodes = useCallback(
    (nodes: CanvasNode[], options: DeleteNodeOptions = {}) => {
      // Delete each node
      const results = nodes.map((node) => deleteSingleNode(node, { ...options }));

      return results.filter(Boolean).length; // Return number of successfully deleted nodes
    },
    [deleteSingleNode],
  );

  return {
    deleteNode: deleteSingleNode,
    deleteNodes,
  };
};
