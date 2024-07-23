import { useEffect } from 'react';
import { useMatch, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { LocalSettings, defaultLocalSettings, useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { mapDefaultLocale } from '@refly-packages/ai-workspace-common/utils/locale';
import { useCookie } from 'react-use';
import { LOCALE } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { getClientOrigin } from '@refly-packages/utils/url';
import { getRuntime } from '../utils/env';

export const useGetUserSettings = () => {
  const userStore = useUserStore();
  const navigate = useNavigate();

  const [token, updateCookie, deleteCookie] = useCookie('_refly_ai_sid');
  const { i18n } = useTranslation();

  const routeLandingPageMatch = useMatch('/');
  const routeLoginPageMatch = useMatch('/login');
  const routeDigestDetailPageMatch = useMatch('/digest/:digestId');
  const routeFeedDetailPageMatch = useMatch('/feed/:feedId');
  const routeAIGCContentDetailPageMatch = useMatch('/content/:digestId');
  const routeThreadDetailPageMatch = useMatch('/thread/:threadId');

  const getLoginStatus = async () => {
    try {
      const res = await getClient().getSettings();
      let { localSettings } = useUserStore.getState();

      console.log('loginStatus', res);

      if (res.error || !res.data) {
        userStore.setUserProfile(undefined);
        userStore.setToken('');
        localStorage.removeItem('refly-user-profile');
        localStorage.removeItem('refly-local-settings');

        if (getRuntime() === 'web') {
          window.location.href = getClientOrigin(true); // 没有登录，直接跳转到登录页
        } else {
          navigate('/'); // 插件等直接导航到首页
        }
      } else {
        userStore.setUserProfile(res?.data);
        localStorage.setItem('refly-user-profile', safeStringifyJSON(res?.data));

        // 增加 localSettings
        let uiLocale = mapDefaultLocale(res?.data?.uiLocale as LOCALE) as LOCALE;
        let outputLocale = res?.data?.outputLocale as LOCALE;

        // 先写回
        localSettings = {
          ...localSettings,
          uiLocale,
          outputLocale,
          isLocaleInitialized: true,
        };

        // 说明是第一次注册使用，此时没有 locale，需要写回
        if (!uiLocale && !outputLocale) {
          uiLocale = mapDefaultLocale((navigator?.language || LOCALE.EN) as LOCALE) as LOCALE;
          outputLocale = (navigator?.language || LOCALE.EN) as LOCALE;
          // 不阻塞写回用户配置
          getClient().updateSettings({
            body: { uiLocale, outputLocale },
          });

          // 如果是初始化的再替换
          localSettings = {
            ...localSettings,
            uiLocale,
            outputLocale,
            isLocaleInitialized: false,
          } as LocalSettings;
        }

        // 应用 locale
        i18n.changeLanguage(uiLocale);

        userStore.setLocalSettings(localSettings);
        localStorage.setItem('refly-user-profile', safeStringifyJSON(res?.data));
        localStorage.setItem('refly-local-settings', safeStringifyJSON(localSettings));
      }
    } catch (err) {
      console.log('getLoginStatus err', err);
      userStore.setUserProfile(undefined);
      userStore.setLocalSettings(defaultLocalSettings);
      userStore.setToken('');
      localStorage.removeItem('refly-user-profile');
      localStorage.removeItem('refly-local-settings');

      if (getRuntime() === 'web') {
        window.location.href = getClientOrigin(true); // 没有登录，直接跳转到登录页
      } else {
        navigate('/'); // 插件等直接导航到首页
      }
    }
  };

  useEffect(() => {
    getLoginStatus();
  }, [token, userStore.loginModalVisible]);
};
