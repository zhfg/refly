import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { Button, Switch, Tag, Tooltip, Select } from '@arco-design/web-react';
import { IconCloseCircle, IconFile, IconFolder, IconFontColors, IconRefresh } from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useGetCurrentEnvContext } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-env-context';

// hooks

interface BaseContextPanelProps {
  title: string;
  skillContent: React.ReactNode;
}

const Option = Select.Option;

export const BaseContextCard = (props: BaseContextPanelProps) => {
  const { title, skillContent } = props;
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { setNowSelectedContextDomain } = useContextPanelStore();
  const searchStateStore = useSearchStateStore();

  const { currentEnvContextKeys, nowSelectedEnvContext, hasContent } = useGetCurrentEnvContext();

  // skill
  const [skills] = useGetSkills();

  return (
    <div className="context-state-card context-state-current-page">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFontColors />
          <span className="context-state-card-header-title">{hasContent ? title : '快捷操作'}</span>
        </div>
        <div className="context-state-card-header-right">
          {currentEnvContextKeys?.length > 0 ? (
            <Select
              bordered={false}
              className="context-state-card-selector"
              value={nowSelectedEnvContext?.key}
              onChange={(val) => {
                setNowSelectedContextDomain(val);
              }}
            >
              {currentEnvContextKeys.map((item, index) => (
                <Option key={item?.key} value={item?.key}>
                  <span style={{ fontSize: 12 }}>{item?.data?.title}</span>
                </Option>
              ))}
            </Select>
          ) : null}
          <Button
            type="text"
            className="assist-action-item"
            icon={
              <IconCloseCircle
                onClick={() => {
                  knowledgeBaseStore.updateSelectedText('');
                  searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
                  knowledgeBaseStore.setShowContextCard(false);
                }}
              />
            }
          ></Button>
        </div>
      </div>
      <div className="context-state-card-body">
        {hasContent ? (
          <div className="context-state-resource-item">
            <Tag icon={<IconFontColors />} bordered className="context-state-resource-item-tag">
              {nowSelectedEnvContext?.data?.title}
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
