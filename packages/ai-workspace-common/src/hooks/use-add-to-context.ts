import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useContextPanelStore } from '../stores/context-panel';
import { CanvasNode } from '../components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { useChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/hooks/use-chat-history';

export const useAddToContext = (node: CanvasNode, nodeType: CanvasNodeType) => {
  const { t } = useTranslation();
  const { handleItemAdd } = useChatHistory();

  return useCallback(() => {
    const contextStore = useContextPanelStore.getState();
    const selectedContextItems = contextStore.contextItems;

    // Check if item is already in context
    const isAlreadyAdded = selectedContextItems.some((item) => {
      if ('id' in node) {
        return item.id === node.id && !item.isPreview;
      }
    });

    // Get node title based on type
    let nodeTitle = '';
    if (node?.data?.metadata?.sourceType === 'documentSelection') {
      nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
    } else if (nodeType === 'skillResponse') {
      nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
    } else {
      nodeTitle = (node as CanvasNode)?.data?.title ?? t('knowledgeBase.context.untitled');
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
  }, [node, nodeType, t]);
};
