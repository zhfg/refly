import { Route, Routes } from '@refly-packages/ai-workspace-common/utils/router';
import KnowledgeBase from '@/pages/knowledge-base';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { LOCALE } from '@refly/common-types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from '@arco-design/web-react';

// Components
import { Login } from '@/pages/login';

// Hooks
import { useGetUserSettings } from '@/hooks/use-get-user-settings';
import { App } from '@/entrypoints/contentSelector-csui.content/App';

export const AppRouter = () => {
  const userStore = useUserStore((state) => ({
    localSettings: state.localSettings,
    userProfile: state.userProfile,
    isCheckingLoginStatus: state.isCheckingLoginStatus,
  }));

  const locale = userStore?.localSettings?.uiLocale || LOCALE.EN;
  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // Check user login status
  useGetUserSettings();

  // Handle i18n
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  // Show loading while checking login status
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

  // Show login page if not logged in
  if (!userStore.userProfile) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/knowledge-base" element={<KnowledgeBase />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};
