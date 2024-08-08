import { Button, Checkbox } from '@arco-design/web-react';
import { IconFontColors, IconHighlight } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '../../hooks/use-selected-mark';
import { useContentSelectorStore } from '../../stores/content-selector';
// styles
import './index.scss';
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';
import { useEffect } from 'react';

interface ContentSelectorBtnProps {}

export const ContentSelectorBtn = (props: ContentSelectorBtnProps) => {
  const contentSelectorStore = useContentSelectorStore();
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
    }
  };

  const baseStyle = {
    marginRight: 0,
    color: contentSelectorStore?.showContentSelector ? '#fff' : '#00000080',
  };

  useEffect(() => {
    const clearEvent = initMessageListener();

    return () => {
      clearEvent?.();
    };
  }, []);

  return (
    <IconTip text={contentSelectorStore?.showContentSelector ? `块选择` : `自由选择`}>
      <Checkbox
        key={'knowledge-base-note-panel'}
        checked={contentSelectorStore?.showContentSelector}
        style={{ padding: 0 }}
      >
        {({ checked }) => {
          return (
            <Button
              icon={checked ? <IconHighlight /> : <IconFontColors />}
              type="text"
              style={{ marginRight: 4 }}
              onClick={() => {
                handleClick();
              }}
              className={classNames('assist-action-item', { active: checked })}
            ></Button>
          );
        }}
      </Checkbox>
    </IconTip>
  );
};
