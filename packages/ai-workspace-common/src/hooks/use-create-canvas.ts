import { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useDebouncedCallback } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';

export const useCreateCanvas = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getCanvasList } = useHandleSiderData();

  const debouncedCreateCanvas = useDebouncedCallback(
    async () => {
      if (isCreating) return;
      try {
        setIsCreating(true);
        const { data } = await getClient().createCanvas({
          body: {
            title: t('common.newCanvas'),
          },
        });

        if (data?.success) {
          message.success(t('canvas.action.addSuccess'));
          navigate(`/canvas/${data?.data?.canvasId}`);
          getCanvasList();
        }
      } finally {
        setIsCreating(false);
      }
    },
    300,
    { leading: true },
  );

  return { debouncedCreateCanvas, isCreating };
};
