import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Tag } from '@arco-design/web-react';
import { IconCloseCircle, IconFile, IconFolder, IconFontColors } from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';

export const ResourceDetailContextPanel = () => {
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
          <IconFile />
          <span className="context-state-card-header-title">选中当前页面问答</span>
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
            {currentResource?.title}
          </Tag>
        </div>
      </div>
      <div className="context-state-card-footer">
        <Button type="primary" size="mini">
          快速总结
        </Button>
        {filterResourceContextSkill?.map((skill, index) => {
          return (
            <Button
              type="primary"
              size="mini"
              style={{ marginLeft: 12 }}
              onClick={() => {
                dispatch({
                  name: skill?.name,
                  type: 'state',
                  body: {
                    modalVisible: true,
                  },
                });
              }}
            >
              保存到知识库
            </Button>
          );
        })}
      </div>
    </div>
  );
};
