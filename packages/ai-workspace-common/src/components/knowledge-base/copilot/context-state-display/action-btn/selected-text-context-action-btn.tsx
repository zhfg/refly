import { Badge, Button, Checkbox, Tooltip } from '@arco-design/web-react';
import { IconFontColors } from '@arco-design/web-react/icon';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

export const SelectedTextContextActionBtn = () => {
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
  const showSelectedTextCard = showContextCard && contextDomain === 'selected-text';

  return (
    <Badge count={count} dotStyle={{ backgroundColor: '#00968F', fontSize: 8, fontWeight: 'bold' }}>
      <Tooltip content={t('copilot.selectedTextCard.title')}>
        <Checkbox
          style={{ paddingLeft: 0 }}
          key={'knowledge-base-resource-panel'}
          checked={showSelectedTextCard ? true : false}
        >
          {({ checked }) => {
            return (
              <Button
                icon={<IconFontColors />}
                type="text"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setShowContextCard(!showSelectedTextCard);

                  // 如果是激活文本，
                  setContextDomain('selected-text');
                }}
                className={classNames('assist-action-item', { active: checked })}
              ></Button>
            );
          }}
        </Checkbox>
      </Tooltip>
    </Badge>
  );
};
