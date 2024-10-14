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

  useEffect(() => {
    const clearEvent = initMessageListener();

    return () => {
      clearEvent?.();
    };
  }, []);

  return (
    <></>
    // <Tooltip getPopupContainer={getPopupContainer} content={t('knowledgeBase.context.contentSelector')}>
    //   <Checkbox
    //     key={'knowledge-base-note-panel'}
    //     checked={contentSelectorStore?.showContentSelector}
    //     style={{ padding: 0, display: 'flex', marginRight: 0 }}
    //   >
    //     {({ checked }) => {
    //       return (
    //         <Button
    //           onClick={() => {
    //             handleToggleContentSelector(!contentSelectorStore.showContentSelector);
    //           }}
    //           icon={contentSelectorStore.scope === 'block' ? <IconHighlight /> : <IconHighlight />}
    //           size="mini"
    //           type="outline"
    //           style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
    //           className={classNames('context-selector-btn', { active: checked })}
    //         ></Button>
    //       );
    //     }}
    //   </Checkbox>
    // </Tooltip>
  );
};
