import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Select, Switch, Tag, Tooltip } from '@arco-design/web-react';
import {
  IconCloseCircle,
  IconFile,
  IconFilter,
  IconFolder,
  IconFontColors,
  IconHighlight,
  IconLink,
  IconRefresh,
} from '@arco-design/web-react/icon';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';
import { ContentSelectorBtn } from '@refly-packages/ai-workspace-common/modules/content-selector/components/content-selector-btn';
import { useContentSelectorStore } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useTranslation } from 'react-i18next';
import {
  useContextPanelStore,
  selectedTextCardDomainWeb,
  selectedTextCardDomainExtension,
  defaultSelectedTextCardDomainKeysWeb,
  defaultSelectedTextCardDomainKeysExtension,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { LOCALE, Mark } from '@refly/common-types';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { PiNotepad, PiNotebookDuotone } from 'react-icons/pi';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';
import { useEffect } from 'react';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface BaseSelectedTextCardProps {
  title: string;
  skillContent: React.ReactNode;
}

const { Option } = Select;

const getIcon = (mark: Mark) => {
  // include noteCursorSelection, noteBeforeCursorSelection, noteAfterCursorSelection
  if (mark.domain?.includes('cursor')) {
    return <IconFontColors />;
  }

  if (mark.domain === 'note') {
    return <PiNotebookDuotone />;
  }

  if (mark.domain === 'resource') {
    return <IconFile />;
  }

  if (mark.domain === 'extensionWeblink') {
    return <IconLink />;
  }
};

export const BaseSelectedTextCard = (props: BaseSelectedTextCardProps) => {
  const { title, skillContent } = props;
  const { t, i18n } = useTranslation();
  const contextPanelStore = useContextPanelStore((state) => ({
    enableMultiSelect: state.enableMultiSelect,
    currentSelectedMarks: state.currentSelectedMarks,
    currentSelectedMark: state.currentSelectedMark,
    resetSelectedTextCardState: state.resetSelectedTextCardState,
    updateCurrentSelectedMark: state.updateCurrentSelectedMark,
    setSelectedTextCardDomain: state.setSelectedTextCardDomain,
    selectedTextCardDomain: state.selectedTextCardDomain,
    updateEnableMultiSelect: state.updateEnableMultiSelect,
    updateCurrentSelectedMarks: state.updateCurrentSelectedMarks,
    setShowContextCard: state.setShowContextCard,
    beforeSelectionNoteContent: state.beforeSelectionNoteContent,
    afterSelectionNoteContent: state.afterSelectionNoteContent,
    currentSelectionContent: state.currentSelectionContent,
  }));
  const { enableMultiSelect, currentSelectedMark } = contextPanelStore;
  const { handleReset } = useSelectedMark();
  const { finalUsedMarks } = useGetCurrentSelectedMark();

  const locale = i18n?.language || LOCALE.EN;
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  console.log('currentSelectedMarks', finalUsedMarks, contextPanelStore);

  // default init all selected text card domain
  useEffect(() => {
    contextPanelStore.setSelectedTextCardDomain(
      isWeb ? defaultSelectedTextCardDomainKeysWeb : defaultSelectedTextCardDomainKeysExtension,
    );
  }, []);

  return (
    <div className="context-state-card context-state-current-page">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFontColors />
          <span className="context-state-card-header-title">{t('copilot.selectedTextCard.title')} </span>
        </div>
        <div className="context-state-card-header-right">
          <Tooltip content={t('knowledgeBase.context.clearSelector')} getPopupContainer={getPopupContainer}>
            <Button
              type="text"
              className="assist-action-item"
              style={{ marginRight: 4 }}
              icon={<IconRefresh />}
              onClick={() => {
                contextPanelStore.resetSelectedTextCardState();
                handleReset();
              }}
            ></Button>
          </Tooltip>
          <ContentSelectorBtn />
          {/* <Tooltip content="多选">
            <Switch
              type="round"
              size="small"
              checked={enableMultiSelect}
              style={{ marginRight: 4 }}
              onChange={(value) => {
                contextPanelStore.updateEnableMultiSelect(value);
                if (currentSelectedMarks?.length === 0) {
                  contextPanelStore.updateCurrentSelectedMarks(currentSelectedMark ? [currentSelectedMark] : []);
                }
              }}
            />
          </Tooltip> */}
          <Button
            type="text"
            className="assist-action-item"
            onClick={() => {
              contextPanelStore.setShowContextCard(false);
            }}
            icon={<IconCloseCircle />}
          ></Button>
        </div>
      </div>
      <div className="context-state-card-body">
        {enableMultiSelect ? (
          finalUsedMarks.map((item, index) => (
            <div className="context-state-resource-item" key={index}>
              <Tag icon={getIcon(item)} bordered className="context-state-resource-item-tag">
                {item?.data}
              </Tag>
            </div>
          ))
        ) : currentSelectedMark ? (
          <div className="context-state-resource-item">
            <Tag icon={getIcon(currentSelectedMark)} bordered className="context-state-resource-item-tag">
              {currentSelectedMark?.data}
            </Tag>
          </div>
        ) : null}
        {(enableMultiSelect && finalUsedMarks.length === 0) || (!enableMultiSelect && !currentSelectedMark) ? (
          <div className="context-state-resource-item">
            <span className="text-gray-500" style={{ fontSize: 12 }}>
              {t('copilot.selectedTextCard.placeholder')}
            </span>
          </div>
        ) : null}
      </div>
      <div className="context-state-card-quick-action">{skillContent}</div>
      <div className="context-state-card-footer">
        <IconFilter />
        <Tooltip content={t('copilot.selectedTextCard.filterTitle')}>
          <Select
            // bordered={false}
            mode="multiple"
            maxTagCount={1}
            className="context-state-card-selector"
            value={contextPanelStore.selectedTextCardDomain}
            onChange={(val) => {
              contextPanelStore.setSelectedTextCardDomain(val);
            }}
            allowClear
            autoWidth={{ minWidth: 266, maxWidth: 340 }}
          >
            {(isWeb ? selectedTextCardDomainWeb : selectedTextCardDomainExtension).map((item, index) => (
              <Option key={item?.key} value={item?.key}>
                <span style={{ fontSize: 12 }}>{item?.labelDict[locale]}</span>
              </Option>
            ))}
          </Select>
        </Tooltip>
      </div>
    </div>
  );
};
