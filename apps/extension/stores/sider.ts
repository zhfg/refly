import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {} from '@redux-devtools/extension'


interface SiderState  {
    // state
    showSider: boolean,

    // method
    setShowSider: (val: boolean) => void;
}

export const useSiderStore = create<SiderState>()(devtools((set) => ({
    showSider: false,

    setShowSider: (val: boolean) => set({ showSider: val })
})))