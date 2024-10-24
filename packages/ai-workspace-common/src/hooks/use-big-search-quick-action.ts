import { useProjectContext } from '@refly-packages/ai-workspace-common/components/project-detail/context-provider';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillInstance } from '@refly/openapi-schema';

export const useBigSearchQuickAction = () => {
  const { emptyConvRunSkill } = useBuildThreadAndRun();
  const skillStore = useSkillStore();
  const { projectId } = useProjectContext();

  const triggerSkillQuickAction = (question: string, skill?: SkillInstance) => {
    if (skill) {
      skillStore.setSelectedSkillInstance(skill);
    }
    emptyConvRunSkill(question, projectId, true);
  };

  return {
    triggerSkillQuickAction,
  };
};
