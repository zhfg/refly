import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
// 类型
import { SkillTrigger } from '@refly/openapi-schema';

interface ImportKnowledgeModal {
  // state
  showtriggerModal: boolean;
  reloadTriggerList?: boolean;
  trigger?: SkillTrigger | null;

  // method
  setShowtriggerModall: (val: boolean) => void;
  setReloadTriggerList: (val: boolean) => void;
  setTrigger: (val: SkillTrigger | null) => void;
}

export const useImportNewTriggerModal = create<ImportKnowledgeModal>()(
  devtools((set) => ({
    showtriggerModal: false,
    reloadTriggerList: false,
    trigger: null,

    setShowtriggerModall: (val: boolean) => set({ showtriggerModal: val }),
    setReloadTriggerList: (val: boolean) => set({ reloadTriggerList: val }),
    setTrigger: (state: SkillTrigger | null) => set({ trigger: state ? { ...state } : null }),
  })),
);
