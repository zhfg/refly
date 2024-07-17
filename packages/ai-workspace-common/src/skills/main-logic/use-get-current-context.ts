/**
 * 只暴露必要的上下文给 Skill 操作，只读，不可写
 */

import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

export const useGetCurrentContext = () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;

  const getCurrentSkillState = (name) => {
    const { skillState } = useSkillStore.getState();

    return skillState?.[name];
  };

  return {
    currentResource,
    currentKnowledgeBase,
    getCurrentSkillState,
  };
};
