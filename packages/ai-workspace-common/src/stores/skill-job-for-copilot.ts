import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
// 类型

interface SkillJobForCopilot {
  // state
  jobId: string;

  // method
  setJobId: (val: string) => void;
}

export const useSkillJobForCopilot = create<SkillJobForCopilot>()(
  devtools((set) => ({
    jobId: '',

    setJobId: (val: string) => set({ jobId: val }),
  })),
);
