import { Dropdown, DropdownProps, MenuProps, Switch } from 'antd';
import { IconDown, IconSettings } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { ModelSelector } from './model-selector';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';

interface AISettingsDropdownProps {
  collapsed?: boolean; // Whether to collapse all settings into dropdown
  className?: string;
  briefMode?: boolean; // Whether to show brief mode
  modelSelectorPlacement?: DropdownProps['placement'];
  placement?: DropdownProps['placement'];
}

export const AISettingsDropdown = ({
  collapsed = false,
  className = '',
  briefMode = false,
  modelSelectorPlacement = 'bottom',
  placement = 'topLeft',
}: AISettingsDropdownProps) => {
  const { t } = useTranslation();

  const chatStore = useChatStoreShallow((state) => ({
    enableWebSearch: state.enableWebSearch,
    setEnableWebSearch: state.setEnableWebSearch,
    enableKnowledgeBaseSearch: state.enableKnowledgeBaseSearch,
    setEnableKnowledgeBaseSearch: state.setEnableKnowledgeBaseSearch,
    enableDeepReasonWebSearch: state.enableDeepReasonWebSearch,
    setEnableDeepReasonWebSearch: state.setEnableDeepReasonWebSearch,
  }));

  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
  }));

  // Common settings items
  const settingsItems: MenuProps['items'] = [
    ...(collapsed
      ? [
          {
            key: 'webSearch',
            label: !skillStore?.selectedSkill?.name ? (
              <div
                className="text-xs flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  chatStore.setEnableWebSearch(!chatStore.enableWebSearch);
                }}
              >
                <Switch size="small" checked={chatStore.enableWebSearch} />
                <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
              </div>
            ) : null,
          },
          {
            key: 'knowledgeBase',
            label: !skillStore?.selectedSkill?.name ? (
              <div
                className="text-xs flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  chatStore.setEnableKnowledgeBaseSearch(!chatStore.enableKnowledgeBaseSearch);
                }}
              >
                <Switch size="small" checked={chatStore.enableKnowledgeBaseSearch} />
                <span className="chat-action-item-text">{t('copilot.knowledgeBaseSearch.title')}</span>
              </div>
            ) : null,
          },
        ]
      : []),
    {
      key: 'enableDeepReasonWebSearch',
      label: (
        <div
          className="text-xs flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            chatStore.setEnableDeepReasonWebSearch(!chatStore.enableDeepReasonWebSearch);
          }}
        >
          <Switch size="small" checked={chatStore.enableDeepReasonWebSearch} />
          <span className="chat-action-item-text">{t('copilot.deepReasonWebSearch.title')}</span>
        </div>
      ),
    },
  ].filter((item) => item.label !== null);

  // If collapsed, add model selector to dropdown items
  const dropdownItems = briefMode
    ? [
        {
          key: 'modelSelector',
          label: <ModelSelector dropdownMode={false} placement={modelSelectorPlacement} />,
        },
        { type: 'divider' as const },
        ...settingsItems,
      ]
    : settingsItems;

  return (
    <>
      {!briefMode && <ModelSelector placement={modelSelectorPlacement} />}
      {!collapsed && !briefMode && !skillStore?.selectedSkill?.name ? (
        <div className="chat-action-item" onClick={() => chatStore.setEnableWebSearch(!chatStore.enableWebSearch)}>
          <Switch size="small" checked={chatStore.enableWebSearch} />
          <span className="chat-action-item-text">{t('copilot.webSearch.title')}</span>
        </div>
      ) : null}
      {!collapsed && !briefMode && !skillStore?.selectedSkill?.name ? (
        <div
          className="chat-action-item"
          onClick={() => chatStore.setEnableKnowledgeBaseSearch(!chatStore.enableKnowledgeBaseSearch)}
        >
          <Switch size="small" checked={chatStore.enableKnowledgeBaseSearch} />
          <span className="chat-action-item-text">{t('copilot.knowledgeBaseSearch.title')}</span>
        </div>
      ) : null}
      <Dropdown
        className="chat-action-item"
        trigger={['click']}
        menu={{ items: dropdownItems }}
        placement={placement || 'topLeft'}
      >
        <a onClick={(e) => e.preventDefault()}>
          <IconSettings fontSize={14} />
          {briefMode ? null : (
            <>
              <span className="chat-action-item-text">{t('copilot.moreSettings')}</span>
              <IconDown />
            </>
          )}
        </a>
      </Dropdown>
    </>
  );
};
