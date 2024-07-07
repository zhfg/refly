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

  setSkillState: (newState: SkillState) => void;
  setSkillInstalces: (skillInstances: SkillInstance[]) => void;
  setSkillTemplates: (skillTemplates: SkillTemplate[]) => void;
  resetState: () => void;
}

export const defaultState = {
  // skills
  skillInstances: [],
  skillTemplates: [],
  skillState: {} as SkillState,
};

export const useSkillStore = create<SkillManageState>()(
  devtools((set) => ({
    ...defaultState,

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),
    setSkillInstalces: (skillInstances: SkillInstance[]) => set((state) => ({ ...state, skillInstances })),
    setSkillTemplates: (skillTemplates: SkillTemplate[]) => set((state) => ({ ...state, skillTemplates })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
