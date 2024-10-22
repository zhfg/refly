import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { SkillInstance } from '@refly/openapi-schema';
import { useSearchParams } from 'react-router-dom';

export const useBigSearchQuickAction = () => {
  // 带着参数跳过去，然后激活会话
  const { emptyConvRunSkill } = useBuildThreadAndRun();
  const skillStore = useSkillStore();

  const triggerSkillQuickAction = (question: string, skill?: SkillInstance) => {
    if (skill) {
      skillStore.setSelectedSkillInstance(skill);
    }
    emptyConvRunSkill(question, true);
  };

  return {
    triggerSkillQuickAction,
  };
};
