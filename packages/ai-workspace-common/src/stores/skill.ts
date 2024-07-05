import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import { SkillMeta } from '@refly/openapi-schema';

export interface SkillState {
  [skillName: string]: any;
}

interface SkillManageState {
  skills: SkillMeta[];

  // skills states
  skillState: SkillState;

  setSkillState: (newState: SkillState) => void;
  setSkills: (skills: SkillMeta[]) => void;
  resetState: () => void;
}

export const defaultState = {
  // skills
  skills: [],
  skillState: {} as SkillState,
};

export const useSkillStore = create<SkillManageState>()(
  devtools((set) => ({
    ...defaultState,

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
