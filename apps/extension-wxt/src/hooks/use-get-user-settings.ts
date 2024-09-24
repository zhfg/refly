import { useEffect, useTransition } from 'react';
import { useMatch, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

// request
import { LocalSettings, defaultLocalSettings, useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';

import { LOCALE } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { Message as message } from '@arco-design/web-react';
import { useCopilotStore } from '@refly-packages/ai-workspace-common/stores/copilot';
import { mapDefaultLocale } from '@/utils/locale';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { useStorage } from './use-storage';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useExtensionMessage } from './use-extension-message';
// import { checkBrowserArc } from '@/utils/browser';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { GetUserSettingsResponse, UserSettings } from '@refly/openapi-schema';
import { browser } from 'wxt/browser';
import debounce from 'lodash.debounce';

interface ExternalLoginPayload {
  name: string;
  data: {
    status: 'success' | 'failed';
    token?: string;
    user?: UserSettings;
  };
}

export const useGetUserSettings = () => {
  const userStore = useUserStore((state) => ({
    resetState: state.resetState,
    setUserProfile: state.setUserProfile,
    setLocalSettings: state.setLocalSettings,
    setIsCheckingLoginStatus: state.setIsCheckingLoginStatus,
  }));
  const navigate = useNavigate();
  const copilotStore = useCopilotStore();

  const { i18n } = useTranslation();
  const [token, setToken] = useStorage('token', '', 'sync');
  const { t } = useTranslation();

  const [loginNotification, setLoginNotification] = useStorage('refly-login-notify', '', 'sync');
  console.log('loginNotification', loginNotification);

  const getLoginStatus = async () => {
    try {
      let { localSettings, userProfile } = useUserStore.getState();
      const lastStatusIsLogin = !!userProfile?.uid;

      if (lastStatusIsLogin) {
        return;
      }

      userStore.setIsCheckingLoginStatus(true);
      const res = await getClient().getSettings();

      console.log('loginStatus', res);

      if (res?.error) {
        userStore.resetState();
        // await storage.removeItem('local:refly-user-profile');
        // await storage.removeItem('local:refly-local-settings');
        userStore.setIsCheckingLoginStatus(false);
        navigate('/login');
      } else {
        const data = res?.data?.data! as UserSettings;
        userStore.setUserProfile(data);

        // 增加 localSettings
        let uiLocale = mapDefaultLocale(data?.uiLocale!) as LOCALE;
        let outputLocale = data?.outputLocale as LOCALE;

        // 先写回
        localSettings = {
          ...localSettings,
          uiLocale,
          outputLocale,
          isLocaleInitialized: true,
        } as LocalSettings;

        // 说明是第一次注册使用，此时没有 locale，需要写回
        if (!uiLocale && !outputLocale) {
          uiLocale = (mapDefaultLocale(navigator?.language) || LOCALE.EN) as LOCALE;
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
          };
        }

        // 应用 locale
        i18n.changeLanguage(uiLocale);
        userStore.setLocalSettings(localSettings);
        userStore.setIsCheckingLoginStatus(false);

        // await storage.setItem('sync:refly-user-profile', safeStringifyJSON(res?.data));
        // await storage.setItem('sync:refly-local-settings', safeStringifyJSON(localSettings));

        if (!lastStatusIsLogin) {
          navigate('/');
        }
      }
    } catch (err) {
      console.log('getLoginStatus err', err);
      userStore.setIsCheckingLoginStatus(false);
      userStore.resetState();
      // await storage.removeItem('sync:refly-user-profile');
      // await storage.removeItem('sync:refly-local-settings');
      navigate('/login');
    }
  };

  const debounceLogin = debounce(getLoginStatus, 300);

  const handleLogout = async () => {
    await storage.removeItem('sync:refly-login-notify');

    userStore.resetState();
    // await storage.removeItem('local:refly-user-profile');
    // await storage.removeItem('local:refly-local-settings');
    navigate('/login');
  };

  // sync storage
  useEffect(() => {
    console.log('loginNotification', loginNotification);
    const loginNotify = safeParseJSON(loginNotification);
    if (loginNotify) {
      if (loginNotify?.login) {
        debounceLogin();
      } else if (loginNotify?.login === false) {
        handleLogout();
      }
    }
  }, [loginNotification]);

  // 监听打开关闭
  useEffect(() => {
    if (copilotStore?.isCopilotOpen) {
      debounceLogin();
    }
  }, [copilotStore?.isCopilotOpen]);

  // 收到消息之后，关闭窗口，保活检查
  const handleExtensionMessage = (request: any) => {
    if (request?.name === 'reflyStatusCheck' && getRuntime() === 'extension-csui') {
      // getLoginStatus();
      // checkBrowserArc();
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleExtensionMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleExtensionMessage);
    };
  }, []);

  return {
    getLoginStatus,
  };
};
