import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import type { User } from "@/types"

export interface UserState {
  // state
  isCheckingLoginStatus: boolean
  userProfile?: User
  token?: string

  // method
  setIsCheckingLoginStatus: (val: boolean) => void
  setUserProfile: (val?: User) => void
  setToken: (val?: string) => void
}

export const defaultState = {
  // messages: fakeMessages as any,
  isCheckingLoginStatus: false,
  userProfile: undefined,
  token: "",
}

export const useUserStore = create<UserState>()(
  devtools(set => ({
    ...defaultState,

    setIsCheckingLoginStatus: (val: boolean) =>
      set(state => ({ ...state, isCheckingLoginStatus: val })),
    setUserProfile: (val?: User) =>
      set(state => ({ ...state, userProfile: val })),
    setToken: (val?: string) => set(state => ({ ...state, token: val })),
  })),
)
