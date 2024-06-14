import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Tag } from '@arco-design/web-react';
import { IconCloseCircle, IconFile, IconFolder, IconFontColors } from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';

export const KnowledgeBaseContextPanel = () => {
  const {
    showKnowledgeBaseContext,
    showResourceContext,
    currentKnowledgeBase,
    currentResource,
    currentSelectedText,
    showSelectedTextContext,
  } = useCopilotContextState();
  const searchStateStore = useSearchStateStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { runTask } = useBuildThreadAndRun();

  // skill
  const [skills] = useGetSkills();
  const filterResourceContextSkill = skills?.filter((skill) => skill?.appScope?.includes('resource.context'));
  const { dispatch } = useDispatchAction();

  return (
    <div className="context-state-card context-state-current-knowledge-base">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFolder />
          <span className="context-state-card-header-title">选中当前知识库问答</span>
        </div>
        <div className="context-state-card-header-right">
          <IconCloseCircle
            onClick={() => {
              searchStateStore.setSearchTarget(SearchTarget.All);
            }}
          />
        </div>
      </div>
      <div className="context-state-card-body">
        <div className="context-state-resource-item">
          <Tag icon={<IconFile />} bordered className="context-state-resource-item-tag">
            {currentKnowledgeBase?.title}
          </Tag>
        </div>
      </div>
      <div className="context-state-card-footer"></div>
    </div>
  );
};
