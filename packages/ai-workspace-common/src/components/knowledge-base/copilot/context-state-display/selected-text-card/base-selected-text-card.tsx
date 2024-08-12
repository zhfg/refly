import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Switch, Tag, Tooltip } from '@arco-design/web-react';
import {
  IconCloseCircle,
  IconFile,
  IconFolder,
  IconFontColors,
  IconHighlight,
  IconRefresh,
} from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';
import { ContentSelectorBtn } from '@refly-packages/ai-workspace-common/modules/content-selector/components/content-selector-btn';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';

interface BaseSelectedTextCardProps {
  title: string;
  skillContent: React.ReactNode;
}

export const BaseSelectedTextCard = (props: BaseSelectedTextCardProps) => {
  const { title, skillContent } = props;
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { enableMultiSelect, currentSelectedMarks = [], currentSelectedMark } = knowledgeBaseStore;
  const { marks = [] } = useContentSelectorStore();
  const searchStateStore = useSearchStateStore();
  const { handleReset } = useSelectedMark();

  // skill
  const [skills] = useGetSkills();
  const hasContent = currentSelectedMark || (enableMultiSelect && currentSelectedMarks?.length > 0);

  return (
    <div className="context-state-card context-state-current-page">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFontColors />
          <span className="context-state-card-header-title">
            {title}{' '}
            {enableMultiSelect ? <span style={{ color: '#00968F' }}>（共 {currentSelectedMarks.length} 个）</span> : ``}
          </span>
        </div>
        <div className="context-state-card-header-right">
          <Button
            type="text"
            className="assist-action-item"
            style={{ marginRight: 4 }}
            icon={
              <IconRefresh
                onClick={() => {
                  knowledgeBaseStore.resetSelectedContextState();
                  handleReset();
                }}
              />
            }
          ></Button>
          <ContentSelectorBtn />
          <Tooltip content="多选">
            <Switch
              type="round"
              size="small"
              checked={enableMultiSelect}
              style={{ marginRight: 4 }}
              onChange={(value) => {
                knowledgeBaseStore.updateEnableMultiSelect(value);
                if (currentSelectedMarks?.length === 0) {
                  knowledgeBaseStore.updateCurrentSelectedMarks(currentSelectedMark ? [currentSelectedMark] : []);
                }
              }}
            />
          </Tooltip>
          <Button
            type="text"
            className="assist-action-item"
            icon={
              <IconCloseCircle
                onClick={() => {
                  knowledgeBaseStore.updateCurrentSelectedMark(null);
                  knowledgeBaseStore.setShowContextCard(false);
                }}
              />
            }
          ></Button>
        </div>
      </div>
      <div className="context-state-card-body">
        {enableMultiSelect ? (
          currentSelectedMarks.map((item, index) => (
            <div className="context-state-resource-item" key={index}>
              <Tag
                icon={item?.xPath ? <IconHighlight /> : <IconFontColors />}
                bordered
                className="context-state-resource-item-tag"
              >
                {item?.data}
              </Tag>
            </div>
          ))
        ) : currentSelectedMark ? (
          <div className="context-state-resource-item">
            <Tag
              icon={currentSelectedMark?.xPath ? <IconHighlight /> : <IconFontColors />}
              bordered
              className="context-state-resource-item-tag"
            >
              {currentSelectedMark?.data}
            </Tag>
          </div>
        ) : (
          <div className="context-state-resource-item">
            <span className="text-gray-500" style={{ fontSize: 12 }}>
              暂无选中内容...
            </span>
          </div>
        )}
      </div>
      <div className="context-state-card-footer">{skillContent}</div>
    </div>
  );
};
