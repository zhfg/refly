import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import type { LOCALE, User } from "@/types"

export interface LocalSettings {
  locale: LOCALE
}

export interface UserState {
  // state
  isCheckingLoginStatus: boolean
  userProfile?: User
  token?: string
  localSettings: LocalSettings // 在获取 user 信息的时候记录这个 settings，并 host 到 localStorage，每次保存更新，类似 userProfile

  // login modal
  loginModalVisible?: boolean

  // method
  setIsCheckingLoginStatus: (val: boolean) => void
  setUserProfile: (val?: User) => void
  setToken: (val?: string) => void
  setLoginModalVisible: (val: boolean) => void
  setLocalSettings: (val: LocalSettings) => void
}

export const defaultState = {
  // messages: fakeMessages as any,
  isCheckingLoginStatus: false,
  userProfile: undefined,
  token: "",
  loginModalVisible: false,
  localSettings: { locale: "en" } as LocalSettings,
}

export const useUserStore = create<UserState>()(
  devtools(set => ({
    ...defaultState,

    setIsCheckingLoginStatus: (val: boolean) =>
      set(state => ({ ...state, isCheckingLoginStatus: val })),
    setUserProfile: (val?: User) =>
      set(state => ({ ...state, userProfile: val })),
    setToken: (val?: string) => set(state => ({ ...state, token: val })),
    setLoginModalVisible: (val: boolean) =>
      set(state => ({ ...state, loginModalVisible: val })),
    setLocalSettings: (val: LocalSettings) =>
      set(state => ({ ...state, localSettings: val })),
  })),
)
