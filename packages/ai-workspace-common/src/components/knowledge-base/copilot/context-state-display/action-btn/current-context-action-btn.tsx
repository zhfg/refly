import { Badge, Button, Checkbox, Tooltip } from '@arco-design/web-react';
import { IconTags } from '@arco-design/web-react/icon';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import classNames from 'classnames';

export const CurrentContextActionBtn = () => {
  const {
    enableMultiSelect,
    currentSelectedContentList,
    currentSelectedText,
    setShowContextCard,
    showContextCard,
    contextDomain,
    setContextDomain,
  } = useKnowledgeBaseStore();

  const count = enableMultiSelect ? currentSelectedContentList.length : currentSelectedText ? 1 : 0;
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
