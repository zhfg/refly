import { Dropdown, DropdownProps } from 'antd';
import { IconDown, IconSettings } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { ModelSelector } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-actions/model-selector';

interface AISettingsDropdownProps {
  collapsed?: boolean; // Whether to collapse all settings into dropdown
  className?: string;
  briefMode?: boolean; // Whether to show brief mode
  modelSelectorPlacement?: DropdownProps['placement'];
  trigger?: DropdownProps['trigger'];
  placement?: DropdownProps['placement'];
}

export const AISettingsDropdown = ({
  collapsed = false,
  className = '',
  briefMode = false,
  modelSelectorPlacement = 'bottom',
  placement = 'topLeft',
  trigger = ['click'],
}: AISettingsDropdownProps) => {
  const { t } = useTranslation();

  // If collapsed, add model selector to dropdown items
  const dropdownItems = [
    {
      key: 'modelSelector',
      label: <ModelSelector dropdownMode={false} placement={modelSelectorPlacement} />,
    },
  ];

  return (
    <>
      <Dropdown
        className="chat-action-item"
        trigger={trigger}
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
