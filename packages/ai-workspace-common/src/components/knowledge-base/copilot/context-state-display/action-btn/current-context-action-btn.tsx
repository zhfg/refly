import { Badge, Button, Checkbox, Tooltip } from '@arco-design/web-react';
import { IconTags } from '@arco-design/web-react/icon';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import classNames from 'classnames';

export const CurrentContextActionBtn = () => {
  const {
    enableMultiSelect,
    currentSelectedMarks,
    currentSelectedMark,
    setShowContextCard,
    showContextCard,
    contextDomain,
    setContextDomain,
  } = useContextPanelStore((state) => ({
    enableMultiSelect: state.enableMultiSelect,
    currentSelectedMarks: state.currentSelectedMarks,
    currentSelectedMark: state.currentSelectedMark,
    setShowContextCard: state.setShowContextCard,
    showContextCard: state.showContextCard,
    contextDomain: state.contextDomain,
    setContextDomain: state.setContextDomain,
  }));

  const count = enableMultiSelect ? currentSelectedMarks.length : currentSelectedMark ? 1 : 0;
  const isContextActionActive =
    showContextCard && ['collection', 'resource', 'note', 'weblink'].includes(contextDomain);

  return (
    <Tooltip content="环境上下文面板">
      <Checkbox
        style={{ paddingLeft: 0 }}
        key={'knowledge-base-resource-panel'}
        checked={isContextActionActive ? true : false}
      >
        {({ checked }) => {
          return (
            <Button
              icon={<IconTags />}
              type="text"
              onClick={() => {
                setShowContextCard(!isContextActionActive);
                setContextDomain('resource');
              }}
              className={classNames('assist-action-item', { active: checked })}
            ></Button>
          );
        }}
      </Checkbox>
    </Tooltip>
  );
};
