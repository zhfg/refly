import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {} from "@redux-devtools/extension"
import { Digest } from "@/types"
// fake-data
import { fakeDigestDetail } from "@/fake-data/digest"

interface DigestDetailState {
  digest: Digest | null

  updateDigest: (newDigest: Digest) => void
  resetState: () => void
}

export const defaultState = {
  digest: fakeDigestDetail || null,
}

export const useDigestDetailStore = create<DigestDetailState>()(
  devtools(set => ({
    ...defaultState,

    updateDigest: (newDigest: Digest) =>
      set(state => ({ ...state, digest: newDigest })),
    resetState: () => set(state => ({ ...state, ...defaultState })),
  })),
)
