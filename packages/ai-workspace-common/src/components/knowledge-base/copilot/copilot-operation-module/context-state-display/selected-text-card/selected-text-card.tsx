import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { BaseSelectedTextCard } from './base-selected-text-card';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';

import { Button, Tag, Dropdown, Menu, Tooltip, Switch } from '@arco-design/web-react';
import { IconCloseCircle, IconFontColors, IconList, IconMore } from '@arco-design/web-react/icon';
import { useResizeBox } from '@refly-packages/ai-workspace-common/hooks/use-resize-box';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { languageNameToLocale } from '@refly/common-types';
import { writingSkills } from '@refly/utils/ai-writing';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

const SubMenu = Menu.SubMenu;
const MenuItem = Menu.Item;

export const SelectedTextCard = () => {
  let finalSkillContent = null;

  // note skill related logic
  const { t, i18n } = useTranslation();
  const uiLocale = (i18n?.languages?.[0] as LOCALE) || LOCALE.EN;
  const localeList = languageNameToLocale?.[uiLocale];

  console.log('NoteSelectedContextPanel', uiLocale, localeList);

  return <BaseSelectedTextCard title="选中资源内容问答" skillContent={finalSkillContent} />;
};
