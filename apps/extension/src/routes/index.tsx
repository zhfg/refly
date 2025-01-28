import { Route, Routes, useMatch } from '@refly-packages/ai-workspace-common/utils/router';

// 页面
import KnowledgeBase from '@/pages/knowledge-base';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { ImportResourceModal } from '@refly-packages/ai-workspace-common/components/import-resource';

// 自定义组件
import { Login } from '@/pages/login';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { LOCALE } from '@refly/common-types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BetaProtectedRoute,
  RequestAccessRoute,
} from '@refly-packages/ai-workspace-common/components/request-access/protected-route';
// requests
import { useGetUserSettings } from '@/hooks/use-get-user-settings';
import { Spin } from '@arco-design/web-react';
// hooks
import { useSetCopilotType } from '@/modules/toggle-copilot/hooks/use-set-copilot-type';
import { useMockInAppResource } from '@/hooks/use-mock-in-app-resource';

export const AppRouter = () => {
  // 在网页时，模拟在知识库的资源选中状态
  const { initMessageListener: initMockMessageListener } = useMockInAppResource();

  const userStore = useUserStore((state) => ({
    localSettings: state.localSettings,
    userProfile: state.userProfile,
    isCheckingLoginStatus: state.isCheckingLoginStatus,
  }));
  const importResourceStore = useImportResourceStore((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
  }));

  const locale = userStore?.localSettings?.uiLocale || LOCALE.EN;

  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // 不需要鉴权即可访问的路由
  const routeLoginPageMatch = useMatch('/login');

  const hasBetaAccess = userStore?.userProfile?.hasBetaAccess || false;

  // set copilotType
  useSetCopilotType();

  // 这里进行用户登录信息检查
  useGetUserSettings();

  // TODO: 国际化相关内容
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);
  useEffect(() => {
    initMockMessageListener();
  }, []);

  // initial display loading
  if (userStore.isCheckingLoginStatus === undefined || userStore.isCheckingLoginStatus) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin />
      </div>
    );
  }

  if (routeLoginPageMatch) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<BetaProtectedRoute component={KnowledgeBase} hasBetaAccess={hasBetaAccess} />}
        />
        <Route
          path="/knowledge-base"
          element={<BetaProtectedRoute component={KnowledgeBase} hasBetaAccess={hasBetaAccess} />}
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/request-access"
          element={<RequestAccessRoute hasBetaAccess={hasBetaAccess} />}
        />
      </Routes>
      {importResourceStore.importResourceModalVisible ? <ImportResourceModal /> : null}
    </>
  );
};
