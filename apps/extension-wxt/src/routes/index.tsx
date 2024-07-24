import { Route, Routes, useMatch } from '@refly/ai-workspace-common/utils/router';

// 页面
import KnowledgeBase from '@/pages/knowledge-base';

// 自定义组件
import { Login } from '@/pages/login';
import { useUserStore } from '@refly/ai-workspace-common/stores/user';
import { LOCALE } from '@refly/common-types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// requests
import { useGetUserSettings } from '@/hooks/use-get-user-settings';

export const AppRouter = () => {
  const userStore = useUserStore();

  const locale = userStore?.localSettings?.uiLocale || LOCALE.EN;

  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // 不需要鉴权即可访问的路由
  const routeLoginPageMatch = useMatch('/login');

  // 这里进行用户登录信息检查
  useGetUserSettings();

  // TODO: 国际化相关内容
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (routeLoginPageMatch) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<KnowledgeBase />} />
      <Route path="/knowledge-base" element={<KnowledgeBase />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};
