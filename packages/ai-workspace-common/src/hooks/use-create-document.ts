import { useCallback, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useCanvasControl } from './use-canvas-control';
import { CanvasNodeType } from '@refly-packages/ai-workspace-common/requests/types.gen';
import { useDebouncedCallback } from 'use-debounce';

export const useCreateDocument = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();
  const { addNode, nodes } = useCanvasControl();

  const createDocument = useCallback(
    async (
      title: string,
      content: string,
      { sourceNodeId, addToCanvas }: { sourceNodeId?: string; addToCanvas?: boolean },
    ) => {
      try {
        setIsCreating(true);
        const { data } = await getClient().createDocument({
          body: {
            title: title ?? `Document-${new Date().toISOString()}`,
            initialContent: content,
          },
        });

        if (data?.success) {
          message.success(t('common.putSuccess'));

          if (addToCanvas) {
            // 找到源节点
            const sourceNode = nodes.find((n) => n.type === 'skillResponse' && n.data?.entityId === sourceNodeId);

            if (!sourceNode) {
              console.warn('Source node not found');
              return null;
            }

            // 创建新的文档节点
            const newNode = {
              type: 'document' as CanvasNodeType,
              data: {
                entityId: data.data.docId,
                title: data.data.title ?? title,
                contentPreview: content,
              },
            };

            // 添加节点和连接
            addNode(newNode, [
              {
                type: 'skillResponse',
                entityId: sourceNodeId,
              },
            ]);
          }

          return data.data;
        }
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [addNode, nodes, t],
  );

  const debouncedCreateDocument = useDebouncedCallback(
    (
      title: string,
      content: string,
      { sourceNodeId, addToCanvas }: { sourceNodeId?: string; addToCanvas?: boolean },
    ) => {
      return createDocument(title, content, { sourceNodeId, addToCanvas });
    },
    300,
    { leading: true },
  );

  return { createDocument, debouncedCreateDocument, isCreating };
};
