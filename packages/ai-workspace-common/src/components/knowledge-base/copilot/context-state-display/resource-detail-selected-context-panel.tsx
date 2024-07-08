import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Tag } from '@arco-design/web-react';
import { IconCloseCircle, IconFile, IconFolder, IconFontColors } from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';

export const ResourceDetailSelectedContextPanel = () => {
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
  const { runSkill } = useBuildThreadAndRun();

  // skill
  const [skills] = useGetSkills();
  const filterResourceContextSkill = skills?.filter((skill) => skill?.appScope?.includes('resource.context'));
  const { dispatch } = useDispatchAction();

  return (
    <div className="context-state-card context-state-current-page">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFontColors />
          <span className="context-state-card-header-title">指定内容问答</span>
        </div>
        <div className="context-state-card-header-right">
          <IconCloseCircle
            onClick={() => {
              knowledgeBaseStore.updateSelectedText('');
              searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
            }}
          />
        </div>
      </div>
      <div className="context-state-card-body">
        <div className="context-state-resource-item">
          <Tag icon={<IconFontColors />} bordered className="context-state-resource-item-tag">
            {currentSelectedText}
          </Tag>
        </div>
        <div className="context-state-action-list">
          <div className="context-state-action-item">
            <Button
              type="primary"
              size="mini"
              style={{ borderRadius: 8 }}
              onClick={() => {
                runSkill(getQuickActionPrompt('explain')?.prompt);
              }}
            >
              解释说明
            </Button>
          </div>
          <div className="context-state-action-item">
            <Button
              type="primary"
              size="mini"
              style={{ borderRadius: 8 }}
              onClick={() => {
                runSkill(getQuickActionPrompt('translate')?.prompt);
              }}
            >
              翻译
            </Button>
          </div>
        </div>
      </div>
      <div className="context-state-card-footer"></div>
    </div>
  );
};
