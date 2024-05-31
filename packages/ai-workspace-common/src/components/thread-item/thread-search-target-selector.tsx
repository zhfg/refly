import { Button, Dropdown, Menu } from '@arco-design/web-react';
import { IconOriginalSize, IconArchive, IconCommon, IconCompass } from '@arco-design/web-react/icon';
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';

import { SearchTarget } from '@refly-packages/ai-workspace-common/stores/search-state';
import { useTranslation } from 'react-i18next';

/**
 * 这里的产品思考：
 * 1. 产品逻辑要打平，不要太复杂
 * 2. 如果用户是选了某个网页或者某几个网页开始提问，那么逻辑应该是这样
 *  2.1 默认是基于选中的网页做持续追问，逻辑是跟随的
 *  2.2 用户可以切换选择所有内容
 *  2.3 No：用户不能再选择切换选中其他网页？
 *  2.4 推迟实现，先简单点 follow 规则和所有网页：用户可以选择基于已有选择、选中新的一组或选择所有内容，这样的好处就是能够倒逼优化多轮效果，做出竞争力，允许用户将多个
 *
 */
interface ThreadSearchTargetSelectorProps {
  searchTarget: SearchTarget;
  showText: boolean;
  handleChangeSelector: (selector: SearchTarget) => void;
}

export const ThreadSearchTargetSelector = (props: ThreadSearchTargetSelectorProps) => {
  const { t } = useTranslation();
  const iconStyle = {
    marginRight: 8,
    fontSize: 16,
    transform: 'translateY(1px)',
  };

  const searchTargetDropList = (
    <Menu
      className="search-target-selector"
      onClickMenuItem={(key) => {
        console.log('trigger menu', key);
        /**
         * 这里是 thread selector，只要求更换 selector，不要求清空 selectedRow
         */
        props.handleChangeSelector(key as SearchTarget);
      }}
    >
      <Menu.Item key={SearchTarget.All}>
        <IconCommon style={iconStyle} />
        {t('threadDetail.item.input.searchScope.all')}
      </Menu.Item>
      <Menu.Item key={SearchTarget.SelectedPages}>
        <IconArchive style={iconStyle} />
        {t('threadDetail.item.input.searchScope.selected')}
      </Menu.Item>
      <Menu.Item key={SearchTarget.SearchEnhance}>
        <IconCompass style={iconStyle} />
        {t('threadDetail.item.input.searchScope.internet')}
      </Menu.Item>
    </Menu>
  );

  const getDisplayText = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return t('threadDetail.item.input.searchScope.selected');
      case SearchTarget.All:
        return t('threadDetail.item.input.searchScope.all');
      case SearchTarget.SearchEnhance:
        return t('threadDetail.item.input.searchScope.internet');
    }
  };

  const getDisplayIcon = (searchTarget: SearchTarget) => {
    switch (searchTarget) {
      case SearchTarget.SelectedPages:
        return <IconArchive />;
      case SearchTarget.CurrentPage:
        return <IconOriginalSize />;
      case SearchTarget.SearchEnhance:
        return <IconCompass />;
      case SearchTarget.All:
        return <IconCommon />;
    }
  };

  return (
    <IconTip text={getDisplayText(props.searchTarget) || t('threadDetail.item.input.searchScope.title')}>
      <Dropdown droplist={searchTargetDropList} trigger="hover" position="bottom">
        <Button
          icon={getDisplayIcon(props.searchTarget || SearchTarget.All)}
          type="text"
          style={props.showText ? {} : { width: 42, height: 32, borderRadius: 16 }}
          shape={props.showText ? 'round' : 'circle'}
        >
          {props.showText ? getDisplayText(props.searchTarget) : null}
        </Button>
      </Dropdown>
    </IconTip>
  );
};
