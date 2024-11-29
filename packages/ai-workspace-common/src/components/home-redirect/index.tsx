import { useEffect } from 'react';
import { useState } from 'react';
import { SuspenseLoading } from '@refly-packages/ai-workspace-common/components/common/loading';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
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
      } else {
        return <Navigate to={`/canvas/empty`} replace />;
      }
    }
    return defaultNode;
  };

  useEffect(() => {
    handleHomeRedirect().then(setElement);
  }, []);

  return element ?? <SuspenseLoading />;
};
