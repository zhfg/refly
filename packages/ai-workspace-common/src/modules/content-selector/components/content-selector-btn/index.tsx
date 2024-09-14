import { Button, Checkbox, Divider, Dropdown, Menu, Message as message, Tooltip } from '@arco-design/web-react';
import { IconCaretDown, IconFontColors, IconHighlight } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '../../hooks/use-selected-mark';
import { useContentSelectorStore } from '../../stores/content-selector';
// styles
import './index.scss';
import { useEffect } from 'react';
import { MarkScope, SyncStatusEvent } from '@refly/common-types';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useHandleContextWorkflow } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-handle-context-workflow';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface ContentSelectorBtnProps {}

const { Item } = Menu;

export const ContentSelectorBtn = (props: ContentSelectorBtnProps) => {
  const contentSelectorStore = useContentSelectorStore((state) => ({
    showContentSelector: state.showContentSelector,
    scope: state.scope,
    setScope: state.setScope,
  }));
  // 设置 selected-mark 的监听器
  const { initMessageListener } = useSelectedMark();
  const { t } = useTranslation();

  const { handleToggleContentSelector } = useHandleContextWorkflow();

  const baseStyle = {
    marginRight: 0,
    color: contentSelectorStore?.showContentSelector ? '#fff' : '#00000080',
  };

  // inline选择和块选择的下拉菜单
  const dropdownMenu = (
    <Menu
      onClickMenuItem={(key, ev) => {
        ev?.stopPropagation?.();

        contentSelectorStore.setScope(key as MarkScope);
        const event: SyncStatusEvent = {
          name: 'syncMarkStatusEvent',
          body: {
            type: 'update',
            scope: key as MarkScope,
          },
        };
        sendMessage({ ...event, source: getRuntime() });
      }}
    >
      <Item key="inline">自由选择</Item>
      <Item key="block">块选择</Item>
    </Menu>
  );

  useEffect(() => {
    const clearEvent = initMessageListener();

    return () => {
      clearEvent?.();
    };
  }, []);

  return (
    <Tooltip content={t('knowledgeBase.context.contentSelector')} getPopupContainer={getPopupContainer}>
      <Checkbox
        key={'knowledge-base-note-panel'}
        checked={contentSelectorStore?.showContentSelector}
        style={{ padding: 0 }}
      >
        {({ checked }) => {
          return (
            <Button
              onClick={() => {
                handleToggleContentSelector(!contentSelectorStore.showContentSelector);
              }}
              icon={contentSelectorStore.scope === 'block' ? <IconHighlight /> : <IconFontColors />}
              type="text"
              style={{ marginRight: 4 }}
              className={classNames('assist-action-item', { active: checked })}
            >
              {/* <Divider type="vertical" style={{ margin: '0 4px' }} /> */}
              {/* <Dropdown droplist={dropdownMenu}>
              <IconCaretDown />
            </Dropdown> */}
            </Button>
          );
        }}
      </Checkbox>
    </Tooltip>
  );
};
