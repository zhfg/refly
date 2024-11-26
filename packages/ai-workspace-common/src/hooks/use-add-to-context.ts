import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useContextPanelStore } from '../stores/context-panel';
import { CanvasNode } from '../components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';

export const useAddToContext = (node: CanvasNode, nodeType: CanvasNodeType) => {
  const { t } = useTranslation();

  return useCallback(() => {
    const contextStore = useContextPanelStore.getState();
    const selectedContextItems = contextStore.selectedContextItems;

    // Check if node is already in context
    const isAlreadyAdded = selectedContextItems.some((item) => item.id === node.id);

    // Get node title based on node type
    let nodeTitle = '';
    if (nodeType === 'skillResponse') {
      nodeTitle = node.data?.title ?? t('knowledgeBase.context.untitled');
    } else {
      nodeTitle = node.data?.title ?? t('knowledgeBase.context.untitled');
    }

    if (isAlreadyAdded) {
      message.warning(
        t('knowledgeBase.context.alreadyAddedWithTitle', {
          title: nodeTitle,
          type: t(`knowledgeBase.context.nodeTypes.${nodeType}`),
        }),
      );
      return;
    }

    // Add node to context
    contextStore.addContextItem(node);
    message.success(
      t('knowledgeBase.context.addSuccessWithTitle', {
        title: nodeTitle,
        type: t(`knowledgeBase.context.nodeTypes.${nodeType}`),
      }),
    );
  }, [node, nodeType, t]);
};
