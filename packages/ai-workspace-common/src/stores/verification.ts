import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface VerificationState {
  modalOpen: boolean;
  email: string | null;
  sessionId: string | null;

  setModalOpen: (val: boolean) => void;
  setSessionId: (val: string | null) => void;
  setEmail: (val: string | null) => void;
  reset: () => void;
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set) => ({
      modalOpen: false,
      email: null,
      sessionId: null,

      setModalOpen: (val: boolean) => set((state) => ({ ...state, modalOpen: val })),
      setSessionId: (val: string | null) => set((state) => ({ ...state, sessionId: val })),
      setEmail: (val: string | null) => set((state) => ({ ...state, email: val })),
      reset: () => set({ modalOpen: false, email: null, sessionId: null }),
    }),
    {
      name: 'verification-storage',
      partialize: (state) => ({
        modalOpen: state.modalOpen,
        sessionId: state.sessionId,
        email: state.email,
      }),
    },
  ),
);

export const useVerificationStoreShallow = <T>(selector: (state: VerificationState) => T) => {
  return useVerificationStore(useShallow(selector));
};
