import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
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
  userProfile?: UserSettings;
  localSettings: LocalSettings; // 在获取 user 信息的时候记录这个 settings，并 host 到 localStorage，每次保存更新，类似 userProfile

  runtime: IRuntime;
  showTourModal: boolean;

  // method
  setIsCheckingLoginStatus: (val: boolean) => void;
  setIsLogin: (val: boolean) => void;
  setUserProfile: (val?: UserSettings) => void;
  setLocalSettings: (val: LocalSettings) => void;
  setRuntime: (val: IRuntime) => void;
  resetState: () => void;
  setShowTourModal: (val: boolean) => void;
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
  isLocaleInitialized: false,
} as LocalSettings;

const defaultCheckingLoginStatus = {
  isCheckingLoginStatus: undefined,
};

export const defaultExtraState = {
  isCheckingLoginStatus: false,
  isLogin: false,
  userProfile: undefined,
  runtime: 'web' as IRuntime,
  localSettings: { ...defaultLocalSettings }, // 默认使用浏览器的 navigator 获取语言，插件里面使用 chrome.i18n.detectLanguage
};

export const defaultState = {
  ...defaultExtraState,
  ...defaultCheckingLoginStatus,
  showTourModal: true,
};

export const useUserStore = create<UserState>()(
  devtools((set) => ({
    ...defaultState,

    setIsCheckingLoginStatus: (val: boolean) => set((state) => ({ ...state, isCheckingLoginStatus: val })),
    setIsLogin: (val: boolean) => set((state) => ({ ...state, isLogin: val })),
    setUserProfile: (val?: UserSettings) => set((state) => ({ ...state, userProfile: val })),
    setLocalSettings: (val: LocalSettings) => set((state) => ({ ...state, localSettings: val })),
    setRuntime: (val: IRuntime) => set((state) => ({ ...state, runtime: val })),
    resetState: () => set((state) => ({ ...state, ...defaultExtraState })),
    setShowTourModal: (val: boolean) => set((state) => ({ ...state, showTourModal: val })),
  })),
);

export const useUserStoreShallow = <T>(selector: (state: UserState) => T) => {
  return useUserStore(useShallow(selector));
};
