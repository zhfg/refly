import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';

export const useAddToContext = () => {
  const { t } = useTranslation();
  const { showLaunchpad, setShowLaunchpad } = useCanvasStoreShallow((state) => ({
    showLaunchpad: state.showLaunchpad,
    setShowLaunchpad: state.setShowLaunchpad,
  }));
  const { handleItemAdd } = useChatHistory();

  const addSingleNodeToContext = useCallback(
    (node: CanvasNode) => {
      const contextStore = useContextPanelStore.getState();
      const selectedContextItems = contextStore.contextItems;
      const nodeType = node?.type;

      // Check if item is already in context
      const isAlreadyAdded = selectedContextItems.some((item) => item.id === node.id && !item.isPreview);

      // Get node title based on type
      let nodeTitle = '';
      if (node?.data?.metadata?.sourceType === 'documentSelection') {
        nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
      } else if (nodeType === 'skillResponse') {
        nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
      } else {
        nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
      }

      if (!showLaunchpad) {
        setShowLaunchpad(true);
      }

      if (isAlreadyAdded) {
        message.warning(
          t('knowledgeBase.context.alreadyAddedWithTitle', {
            title: nodeTitle,
            type: t(`knowledgeBase.context.nodeTypes.${nodeType}`),
          }),
        );
        return false;
      }

      // Add to context
      contextStore.addContextItem(node);
      if (nodeType === 'skillResponse') {
        handleItemAdd(node);
      }

      message.success(
        t('knowledgeBase.context.addSuccessWithTitle', {
          title: nodeTitle,
          type: t(`knowledgeBase.context.nodeTypes.${nodeType}`),
        }),
      );

      return true;
    },
    [showLaunchpad, setShowLaunchpad, handleItemAdd, t],
  );

  const addNodesToContext = useCallback(
    (nodes: CanvasNode[]) => {
      // Filter out memo, skill, and group nodes
      // Filter out memo, skill, and group nodes
      const validNodes = nodes.filter((node) => !['skill', 'memo', 'group'].includes(node.type));

      if (!showLaunchpad) {
        setShowLaunchpad(true);
      }

      // Add each valid node to context
      const results = validNodes.map((node) => addSingleNodeToContext(node));

      return results.filter(Boolean).length; // Return number of successfully added nodes
    },
    [showLaunchpad, setShowLaunchpad, addSingleNodeToContext],
  );

  return {
    addToContext: addSingleNodeToContext,
    addNodesToContext,
  };
};
