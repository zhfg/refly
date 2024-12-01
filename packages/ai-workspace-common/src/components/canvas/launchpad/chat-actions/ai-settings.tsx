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

  return (
    <>
      <ModelSelector placement={modelSelectorPlacement} />
    </>
  );
};
