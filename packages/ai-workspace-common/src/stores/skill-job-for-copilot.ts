import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

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

export const useSkillJobForCopilotShallow = <T>(selector: (state: SkillJobForCopilot) => T) => {
  return useSkillJobForCopilot(useShallow(selector));
};
