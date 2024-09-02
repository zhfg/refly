import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { SkillTemplate, SkillInstance } from '@refly/openapi-schema';

export interface SkillState {
  [skillName: string]: any;
}

interface SkillManageState {
  skillInstances: SkillInstance[];
  skillTemplates: SkillTemplate[];

  // skills states
  skillState: SkillState;

  selectedSkill: SkillInstance | null;

  // manage skill
  skillManagerModalVisible: boolean;

  setSkillState: (newState: SkillState) => void;
  setSkillInstances: (skillInstances: SkillInstance[]) => void;
  setSkillTemplates: (skillTemplates: SkillTemplate[]) => void;
  setSelectedSkillInstalce: (skillInstance: SkillInstance) => void;
  setSkillManagerModalVisible: (visible: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  // skills
  skillInstances: [],
  skillTemplates: [],
  skillState: {} as SkillState,
  selectedSkill: null,
  skillManagerModalVisible: false,
};

export const useSkillStore = create<SkillManageState>()(
  devtools((set) => ({
    ...defaultState,

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),
    setSkillInstances: (skillInstances: SkillInstance[]) => set((state) => ({ ...state, skillInstances })),
    setSkillTemplates: (skillTemplates: SkillTemplate[]) => set((state) => ({ ...state, skillTemplates })),
    setSelectedSkillInstalce: (skillInstance: SkillInstance) =>
      set((state) => ({ ...state, selectedSkill: skillInstance })),
    setSkillManagerModalVisible: (visible: boolean) =>
      set((state) => ({ ...state, skillManagerModalVisible: visible })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
