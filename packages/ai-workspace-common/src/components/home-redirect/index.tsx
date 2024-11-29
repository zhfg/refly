import { useEffect } from 'react';
import { useState } from 'react';
import { SuspenseLoading } from '@refly-packages/ai-workspace-common/components/common/loading';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useTranslation } from 'react-i18next';

export const HomeRedirect = ({ defaultNode }: { defaultNode: ReactNode }) => {
  const { t } = useTranslation();
  const [element, setElement] = useState<ReactNode | null>(null);
  const { isLogin } = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
  }));

  const handleHomeRedirect = async () => {
    if (isLogin) {
      const savedCanvasId = localStorage.getItem('currentCanvasId');

      if (savedCanvasId) {
        return <Navigate to={`/canvas/${savedCanvasId}`} replace />;
      }

      try {
        const { data } = await getClient().listCanvases({
          body: {
            page: 1,
            pageSize: 1,
          },
        });
        const canvasIdExist = data?.data?.[0]?.canvasId;
        if (canvasIdExist) {
          return <Navigate to={`/canvas/${canvasIdExist}`} replace />;
        } else {
          const { data: createData } = await getClient().createCanvas({
            body: {
              title: t('common.newCanvas'),
            },
          });
          const canvasIdNew = createData?.data?.canvasId;
          if (canvasIdNew) {
            return <Navigate to={`/canvas/${canvasIdNew}`} replace />;
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    return defaultNode;
  };

  useEffect(() => {
    handleHomeRedirect().then(setElement);
  }, []);

  return element ?? <SuspenseLoading />;
};
