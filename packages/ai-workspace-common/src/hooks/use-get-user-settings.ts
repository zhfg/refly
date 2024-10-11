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
import { getClientOrigin, getWebLogin } from '@refly-packages/utils/url';
import { getRuntime } from '../utils/env';
import { GetUserSettingsResponse } from '@refly/openapi-schema';

export const useGetUserSettings = () => {
  const userStore = useUserStore((state) => ({
    setUserProfile: state.setUserProfile,
    setLocalSettings: state.setLocalSettings,
    setToken: state.setToken,
    setIsCheckingLoginStatus: state.setIsCheckingLoginStatus,
    loginModalVisible: state.loginModalVisible,
    userProfile: state.userProfile,
    localSettings: state.localSettings,
    isCheckingLoginStatus: state.isCheckingLoginStatus,
  }));
  const navigate = useNavigate();

  const [token] = useCookie('_refly_ai_sid');
  const { i18n } = useTranslation();

  const routeLandingPageMatch = useMatch('/');
  const routePrivacyPageMatch = useMatch('/privacy');
  const routeTermsPageMatch = useMatch('/terms');
  const routeLoginPageMatch = useMatch('/login');
  const routeDigestDetailPageMatch = useMatch('/digest/:digestId');
  const routeFeedDetailPageMatch = useMatch('/feed/:feedId');
  const routeAIGCContentDetailPageMatch = useMatch('/content/:digestId');
  const routeThreadDetailPageMatch = useMatch('/thread/:threadId');
  const isWebLogin = useMatch('/login');

  const getLoginStatus = async () => {
    let error: any;
    let res: GetUserSettingsResponse;

    userStore.setIsCheckingLoginStatus(true);
    if (token) {
      const resp = await getClient().getSettings();
      error = resp.error;
      res = resp.data;
    }
    let { localSettings } = userStore;

    // Handle
    if (!token || error || !res.data) {
      userStore.setIsCheckingLoginStatus(false);
      userStore.setUserProfile(undefined);
      userStore.setLocalSettings(defaultLocalSettings);
      userStore.setToken('');
      localStorage.removeItem('refly-user-profile');
      localStorage.removeItem('refly-local-settings');

      if (getRuntime() === 'web') {
        window.location.href = getWebLogin(); // Redirect to login page for web
      } else {
        navigate('/'); // Extension should navigate to home
      }
      return;
    }

    userStore.setUserProfile(res.data);
    localStorage.setItem('refly-user-profile', safeStringifyJSON(res.data));

    // Add localSettings
    let uiLocale = mapDefaultLocale(res?.data?.uiLocale as LOCALE) as LOCALE;
    let outputLocale = res?.data?.outputLocale as LOCALE;

    // Write back first
    localSettings = {
      ...localSettings,
      uiLocale,
      outputLocale,
      isLocaleInitialized: true,
    };

    // This indicates it's the first time registering and using, so there's no locale set. We need to write it back.
    if (!uiLocale && !outputLocale) {
      uiLocale = mapDefaultLocale((navigator?.language || LOCALE.EN) as LOCALE) as LOCALE;
      outputLocale = (navigator?.language || LOCALE.EN) as LOCALE;
      // Don't block writing back user configuration
      getClient().updateSettings({
        body: { uiLocale, outputLocale },
      });

      // Replace if it's initialization
      localSettings = {
        ...localSettings,
        uiLocale,
        outputLocale,
        isLocaleInitialized: false,
      } as LocalSettings;
    }

    // Apply locale
    i18n.changeLanguage(uiLocale);

    userStore.setLocalSettings(localSettings);
    localStorage.setItem('refly-user-profile', safeStringifyJSON(res?.data));
    localStorage.setItem('refly-local-settings', safeStringifyJSON(localSettings));
    userStore.setIsCheckingLoginStatus(false);
  };

  const getLoginStatusForLogin = async () => {
    let error: any;
    let res: GetUserSettingsResponse;

    userStore.setIsCheckingLoginStatus(true);
    if (token) {
      const resp = await getClient().getSettings();
      error = resp.error;
      res = resp.data;
    }

    if (!token || error || !res.data) {
      userStore.setIsCheckingLoginStatus(false);
      userStore.setUserProfile(undefined);
      userStore.setLocalSettings(defaultLocalSettings);
      userStore.setToken('');
      localStorage.removeItem('refly-user-profile');
      localStorage.removeItem('refly-local-settings');

      if (
        routeLandingPageMatch ||
        routePrivacyPageMatch ||
        routeTermsPageMatch ||
        routeLoginPageMatch ||
        routeDigestDetailPageMatch ||
        routeFeedDetailPageMatch ||
        routeAIGCContentDetailPageMatch ||
        routeThreadDetailPageMatch ||
        isWebLogin
      ) {
        console.log("Matched a page that doesn't require authentication, display directly");
      } else {
        navigate('/');
      }
    } else {
      userStore.setIsCheckingLoginStatus(false);
      // Authentication successful, redirect to app.refly.ai
      window.location.href = getClientOrigin(false);
    }
  };

  useEffect(() => {
    if (isWebLogin) {
      getLoginStatusForLogin();
    } else {
      getLoginStatus();
    }
  }, [token, userStore.loginModalVisible]);
};
