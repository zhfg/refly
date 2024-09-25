import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import { LOCALE } from '@refly/common-types';
import { UserSettings } from '@refly/openapi-schema';
import { OutputLocale } from '@refly-packages/ai-workspace-common/utils/i18n';
import { IRuntime } from '@refly/common-types';

export interface LocalSettings {
  uiLocale: LOCALE; // UI 相关的
  outputLocale: OutputLocale; // 模型输出相关的
  isLocaleInitialized: boolean; // locale 是否是初始化状态，用于展示语言
}

export interface UserState {
  // state
  isCheckingLoginStatus: boolean | undefined;
  isLogin: boolean;
  loginProvider: string;
  userProfile?: UserSettings;
  token?: string;
  localSettings: LocalSettings; // 在获取 user 信息的时候记录这个 settings，并 host 到 localStorage，每次保存更新，类似 userProfile

  runtime: IRuntime;

  // login modal
  loginModalVisible?: boolean;
  waitingListModalVisible?: boolean; // 前期处理

  // method
  setIsCheckingLoginStatus: (val: boolean) => void;
  setIsLogin: (val: boolean) => void;
  setLoginProvider: (val: string) => void;
  setUserProfile: (val?: UserSettings) => void;
  setToken: (val?: string) => void;
  setLoginModalVisible: (val: boolean) => void;
  setWaitingListModalVisible: (val: boolean) => void;
  setLocalSettings: (val: LocalSettings) => void;
  setRuntime: (val: IRuntime) => void;
  resetState: () => void;
}

const getDefaultLocale = () => {
  const language = navigator.language;

  if (language?.toLocaleLowerCase()?.startsWith('en')) {
    return 'en';
  }

  if (language?.toLocaleLowerCase()?.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en';
};

export const defaultLocalSettings = {
  uiLocale: getDefaultLocale(),
  outputLocale: navigator.language,
  isLocaleInitialized: false, // locale 是否是初始化状态，用于展示语言
} as LocalSettings;

const defaultCheckingLoginStatus = {
  isCheckingLoginStatus: undefined,
};

export const defaultExtraState = {
  // messages: fakeMessages as any,
  isCheckingLoginStatus: false,
  isLogin: false,
  loginProvider: '',
  userProfile: undefined,
  token: '',
  runtime: 'web' as IRuntime,
  loginModalVisible: false,
  waitingListModalVisible: false,
  localSettings: { ...defaultLocalSettings }, // 默认使用浏览器的 navigator 获取语言，插件里面使用 chrome.i18n.detectLanguage
};

export const defaultState = {
  ...defaultExtraState,
  ...defaultCheckingLoginStatus,
};

export const useUserStore = create<UserState>()(
  devtools((set) => ({
    ...defaultState,

    setIsCheckingLoginStatus: (val: boolean) => set((state) => ({ ...state, isCheckingLoginStatus: val })),
    setIsLogin: (val: boolean) => set((state) => ({ ...state, isLogin: val })),
    setLoginProvider: (val: string) => set((state) => ({ ...state, loginProvider: val })),
    setUserProfile: (val?: UserSettings) => set((state) => ({ ...state, userProfile: val })),
    setToken: (val?: string) => set((state) => ({ ...state, token: val })),
    setLoginModalVisible: (val: boolean) => set((state) => ({ ...state, loginModalVisible: val })),
    setWaitingListModalVisible: (val: boolean) => set((state) => ({ ...state, waitingListModalVisible: val })),
    setLocalSettings: (val: LocalSettings) => set((state) => ({ ...state, localSettings: val })),
    setRuntime: (val: IRuntime) => set((state) => ({ ...state, runtime: val })),
    resetState: () => set((state) => ({ ...state, ...defaultExtraState })),
  })),
);
