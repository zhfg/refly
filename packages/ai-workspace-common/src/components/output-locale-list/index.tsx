import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Menu, Message as message } from '@arco-design/web-react';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { LOCALE } from '@refly/common-types';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { OutputLocale, enLocale, localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
// styles
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { IconCaretDown, IconDown, IconTranslate } from '@arco-design/web-react/icon';
import classNames from 'classnames';

export const OutputLocaleList = (props: {
  children?: any;
  showTitle?: boolean;
  width?: number;
  position?: 'tl' | 'tr' | 'bl' | 'br';
}) => {
  // i18n
  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;

  const userStore = useUserStore();
  let { outputLocale } = userStore?.localSettings || {};
  outputLocale = outputLocale || 'auto';

  const changeLang = async (lng: OutputLocale) => {
    const { localSettings } = useUserStore.getState();

    userStore.setLocalSettings({ ...localSettings, outputLocale: lng });
    localStorage.setItem('refly-local-settings', safeStringifyJSON({ ...localSettings, outputLocale: lng }));

    // 不阻塞写回用户配置
    const { data: res, error } = await getClient().updateSettings({
      body: { outputLocale: lng, uiLocale: localSettings.uiLocale },
    });

    if (error || !res.success) {
      message.error(t('settings.action.putErrorNotify'));
    }
  };

  const dropList = (
    <Menu
      className={'output-locale-list-menu'}
      style={{ width: props?.width }}
      onClickMenuItem={(key) => changeLang(key as OutputLocale)}
    >
      {props.showTitle && (
        <div className="output-locale-list-menu-title">{t('settings.language.outputLocale.title')}</div>
      )}
      {enLocale.map((item: OutputLocale) => (
        <Menu.Item key={item} className={`output-locale-list-menu-item ${item === outputLocale ? 'active' : ''}`}>
          {localeToLanguageName?.[uiLocale]?.[item]}
        </Menu.Item>
      ))}
    </Menu>
  );

  const displayLocale =
    outputLocale === 'auto'
      ? t('settings.language.outputLocale.auto')
      : localeToLanguageName?.[uiLocale]?.[outputLocale];

  return (
    <Dropdown
      droplist={dropList}
      position={props.position || 'tl'}
      trigger="click"
      getPopupContainer={getPopupContainer}
    >
      {props.children || (
        <span className={classNames('output-locale-list-btn', 'chat-action-item')}>
          <IconDown /> {displayLocale} {outputLocale === 'auto' && <IconTranslate style={{ marginLeft: 4 }} />}
        </span>
      )}
    </Dropdown>
  );
};
