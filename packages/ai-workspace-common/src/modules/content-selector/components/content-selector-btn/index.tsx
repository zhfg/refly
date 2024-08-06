import { Button } from '@arco-design/web-react';
import { IconHighlight } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelectedMark } from '@/hooks/use-selected-mark';
import { useContentSelectorStore } from '@/stores/content-selector';
import { IconTip } from '@/components/icon-tip';
// styles
import './index.scss';

interface ContentSelectorBtnProps {
  btnType?: 'default' | 'text';
  // handleChangeSelector?: (selector: SearchTarget) => void;
}

export const ContentSelectorBtn = (props: ContentSelectorBtnProps) => {
  const { btnType = 'default' } = props;
  const contentSelectorStore = useContentSelectorStore();
  // 设置 selected-mark 的监听器
  const { handleToggleContentSelector } = useSelectedMark();
  const { t } = useTranslation();

  const handleClick = async () => {
    // 这里需要切换一下对应的 searchTarget
    const { showContentSelector } = useContentSelectorStore.getState();

    // 还未选中，马上选中时，将 target 切为 CurrentPage
    // if (!showContentSelector) {
    //   props?.handleChangeSelector?.(SearchTarget.CurrentPage);
    // }

    handleToggleContentSelector(!showContentSelector);
  };

  const getBtnType = () => {
    const { showContentSelector } = contentSelectorStore;

    if (showContentSelector) return 'primary';

    return btnType;
  };

  const baseStyle = {
    marginRight: 0,
    color: contentSelectorStore?.showContentSelector ? '#fff' : '#00000080',
  };
  const style =
    btnType === 'text'
      ? {
          ...baseStyle,
          width: 45,
          height: 32,
          borderRadius: 16,
          marginRight: 4,
        }
      : baseStyle;

  return (
    <IconTip
      text={
        contentSelectorStore?.showContentSelector
          ? t('extension.loggedHomePage.homePage.contentSelector.tip.cancelSelect')
          : t('extension.loggedHomePage.homePage.contentSelector.tip.select')
      }
    >
      <Button
        className={classNames('content-selector-btn', {
          'content-selector-btn-selected': contentSelectorStore?.showContentSelector,
        })}
        onClick={() => {
          handleClick();
        }}
        type={getBtnType()}
        icon={<IconHighlight />}
        style={style}
        shape="round"
      ></Button>
    </IconTip>
  );
};
