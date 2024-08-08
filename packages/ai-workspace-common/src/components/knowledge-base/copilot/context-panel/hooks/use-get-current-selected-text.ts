import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';

export const useGetCurrentSelectedMark = () => {
  const { currentSelectedMark } = useCopilotContextState();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { enableMultiSelect, currentSelectedMarks = [] } = knowledgeBaseStore;
  const searchStateStore = useSearchStateStore();

  // skill
  const [skills] = useGetSkills();
  const hasContent = currentSelectedMark || (enableMultiSelect && currentSelectedMarks?.length > 0);

  return {
    hasContent,
    currentSelectedMark,
  };
};
