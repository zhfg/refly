import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import { ContentDetail } from '@refly/openapi-schema';

interface DigestDetailState {
  digest: ContentDetail | null;

  updateDigest: (newDigest: ContentDetail) => void;
  resetState: () => void;
}

export const defaultState = {
  digest: null,
};

export const useDigestDetailStore = create<DigestDetailState>()(
  devtools((set) => ({
    ...defaultState,

    updateDigest: (newDigest: ContentDetail) => set((state) => ({ ...state, digest: newDigest })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
