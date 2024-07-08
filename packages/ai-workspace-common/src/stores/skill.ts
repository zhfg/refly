import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
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

  setSkillState: (newState: SkillState) => void;
  setSkillInstalces: (skillInstances: SkillInstance[]) => void;
  setSkillTemplates: (skillTemplates: SkillTemplate[]) => void;
  setSelectedSkillInstalce: (skillInstance: SkillInstance) => void;
  resetState: () => void;
}

export const defaultState = {
  // skills
  skillInstances: [],
  skillTemplates: [],
  skillState: {} as SkillState,
  selectedSkill: null,
};

export const useSkillStore = create<SkillManageState>()(
  devtools((set) => ({
    ...defaultState,

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),
    setSkillInstalces: (skillInstances: SkillInstance[]) => set((state) => ({ ...state, skillInstances })),
    setSkillTemplates: (skillTemplates: SkillTemplate[]) => set((state) => ({ ...state, skillTemplates })),
    setSelectedSkillInstalce: (skillInstance: SkillInstance) =>
      set((state) => ({ ...state, selectedSkill: skillInstance })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
