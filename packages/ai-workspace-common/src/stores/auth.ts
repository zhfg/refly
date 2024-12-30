import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface AuthState {
  email: string | null;
  sessionId: string | null;
  verificationModalOpen: boolean;
  resetPasswordModalOpen: boolean;

  setVerificationModalOpen: (val: boolean) => void;
  setResetPasswordModalOpen: (val: boolean) => void;
  setSessionId: (val: string | null) => void;
  setEmail: (val: string | null) => void;
  reset: () => void;
}

const defaultState = {
  email: null,
  sessionId: null,
  verificationModalOpen: false,
  resetPasswordModalOpen: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...defaultState,

      setVerificationModalOpen: (val: boolean) => set((state) => ({ ...state, verificationModalOpen: val })),
      setResetPasswordModalOpen: (val: boolean) => set((state) => ({ ...state, resetPasswordModalOpen: val })),
      setSessionId: (val: string | null) => set((state) => ({ ...state, sessionId: val })),
      setEmail: (val: string | null) => set((state) => ({ ...state, email: val })),
      reset: () => set({ ...defaultState }),
    }),
    {
      name: 'verification-storage',
      partialize: (state) => ({
        verificationModalOpen: state.verificationModalOpen,
        resetPasswordModalOpen: state.resetPasswordModalOpen,
        sessionId: state.sessionId,
        email: state.email,
      }),
    },
  ),
);

export const useAuthStoreShallow = <T>(selector: (state: AuthState) => T) => {
  return useAuthStore(useShallow(selector));
};
