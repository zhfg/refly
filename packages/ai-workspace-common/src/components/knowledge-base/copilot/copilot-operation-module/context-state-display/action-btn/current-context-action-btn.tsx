import { Badge, Button, Checkbox, Tooltip } from '@arco-design/web-react';
import { IconTags } from '@arco-design/web-react/icon';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  const count = enableMultiSelect ? currentSelectedMarks.length : currentSelectedMark ? 1 : 0;
  const isContextActionActive =
    showContextCard && ['collection', 'resource', 'note', 'weblink'].includes(contextDomain);

  return (
    <Tooltip content={t('copilot.baseContextCard.title')} getPopupContainer={getPopupContainer}>
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
              style={{ fontSize: 12 }}
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
