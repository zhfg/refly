import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';

import { genMemoID } from '@refly-packages/utils/id';
import { XYPosition } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

export const useCreateMemo = () => {
  const { t } = useTranslation();
  const { addNode } = useAddNode();

  const createMemo = (options: { content: string; position?: XYPosition }) => {
    const memoId = genMemoID();

    addNode(
      {
        type: 'memo',
        data: {
          title: t('canvas.nodeTypes.memo'),
          contentPreview: options.content,
          entityId: memoId,
        },
        position: options.position,
      },
      undefined,
      false,
      true,
    );
  };

  return { createMemo };
};
