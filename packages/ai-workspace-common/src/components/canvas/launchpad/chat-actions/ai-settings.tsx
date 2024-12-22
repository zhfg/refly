import { DropdownProps } from 'antd';
import { ModelSelector } from './model-selector';

interface AISettingsDropdownProps {
  collapsed?: boolean; // Whether to collapse all settings into dropdown
  className?: string;
  briefMode?: boolean; // Whether to show brief mode
  placement?: DropdownProps['placement'];
  trigger?: DropdownProps['trigger'];
}

export const AISettingsDropdown = ({
  collapsed = false,
  className = '',
  briefMode = false,
  placement = 'bottomLeft',
  trigger = ['click'],
}: AISettingsDropdownProps) => {
  return (
    <>
      <ModelSelector className={className} placement={placement} trigger={trigger} briefMode={briefMode} />
    </>
  );
};
