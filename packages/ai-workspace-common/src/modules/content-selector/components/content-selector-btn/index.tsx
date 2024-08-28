import { Button, Checkbox, Divider, Dropdown, Menu, Message as message } from '@arco-design/web-react';
import { IconCaretDown, IconFontColors, IconHighlight } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '../../hooks/use-selected-mark';
import { useContentSelectorStore } from '../../stores/content-selector';
// styles
import './index.scss';
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';
import { useEffect } from 'react';
import { MarkScope, SyncStatusEvent } from '@refly/common-types';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';

interface ContentSelectorBtnProps {}

const { Item } = Menu;

export const ContentSelectorBtn = (props: ContentSelectorBtnProps) => {
  const noteStore = useNoteStore();
  const contentSelectorStore = useContentSelectorStore((state) => ({
    showContentSelector: state.showContentSelector,
    scope: state.scope,
    setScope: state.setScope,
  }));
  // 设置 selected-mark 的监听器
  const { handleInitContentSelectorListener, handleStopContentSelectorListener, initMessageListener } =
    useSelectedMark();
  const { t } = useTranslation();

  const handleClick = async () => {
    // 这里需要切换一下对应的 searchTarget
    const { showContentSelector } = useContentSelectorStore.getState();

    if (showContentSelector) {
      handleStopContentSelectorListener();
    } else {
      handleInitContentSelectorListener();

      // 将 note 切入只读模式
      const { currentNote } = useNoteStore.getState();
      noteStore.updateCurrentNote({ ...currentNote, readOnly: true });
      message.info('开启选择内容提问，笔记已进入只读模式');
    }
  };

  const baseStyle = {
    marginRight: 0,
    color: contentSelectorStore?.showContentSelector ? '#fff' : '#00000080',
  };

  // inline选择和块选择的下拉菜单
  const dropdownMenu = (
    <Menu
      onClickMenuItem={(key) => {
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
    <Checkbox
      key={'knowledge-base-note-panel'}
      checked={contentSelectorStore?.showContentSelector}
      style={{ padding: 0 }}
    >
      {({ checked }) => {
        return (
          <Button
            onClick={() => {
              handleClick();
            }}
            icon={contentSelectorStore.scope === 'block' ? <IconHighlight /> : <IconFontColors />}
            type="text"
            style={{ marginRight: 4 }}
            className={classNames('assist-action-item', { active: checked })}
          >
            <Divider type="vertical" style={{ margin: '0 4px' }} />
            <Dropdown droplist={dropdownMenu}>
              <IconCaretDown />
            </Dropdown>
          </Button>
        );
      }}
    </Checkbox>
  );
};
