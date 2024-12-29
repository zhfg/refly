import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface VerificationState {
  modalOpen: boolean;
  sessionId: string | null;

  setModalOpen: (val: boolean) => void;
  setSessionId: (val: string | null) => void;
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set) => ({
      modalOpen: false,
      sessionId: null,

      setModalOpen: (val: boolean) => set((state) => ({ ...state, modalOpen: val })),
      setSessionId: (val: string | null) => set((state) => ({ ...state, sessionId: val })),
    }),
    {
      name: 'verification-storage',
      partialize: (state) => ({
        modalOpen: state.modalOpen,
        sessionId: state.sessionId,
      }),
    },
  ),
);

export const useVerificationStoreShallow = <T>(selector: (state: VerificationState) => T) => {
  return useVerificationStore(useShallow(selector));
};
