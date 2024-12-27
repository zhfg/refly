import { DropdownProps } from 'antd';
import { ModelSelector } from './model-selector';
import { memo } from 'react';

interface AISettingsDropdownProps {
  collapsed?: boolean; // Whether to collapse all settings into dropdown
  className?: string;
  briefMode?: boolean; // Whether to show brief mode
  placement?: DropdownProps['placement'];
  trigger?: DropdownProps['trigger'];
}

export const AISettingsDropdown = memo(
  ({
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.collapsed === nextProps.collapsed &&
      prevProps.className === nextProps.className &&
      prevProps.briefMode === nextProps.briefMode &&
      prevProps.placement === nextProps.placement &&
      JSON.stringify(prevProps.trigger) === JSON.stringify(nextProps.trigger)
    );
  },
);

AISettingsDropdown.displayName = 'AISettingsDropdown';
