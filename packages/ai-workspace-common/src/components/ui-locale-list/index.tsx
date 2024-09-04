import { useTranslation } from 'react-i18next';
import { Dropdown, Menu, Message as message } from '@arco-design/web-react';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { LOCALE } from '@refly/common-types';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// styles
import './index.scss';

export const UILocaleList = (props: { children: React.ReactNode; width?: number }) => {
  // i18n
  const { t, i18n } = useTranslation();
  const userStore = useUserStore();

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(localStorage.getItem('refly-user-profile'));
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid;
  console.log('storageUserProfile', storageUserProfile, userStore?.userProfile);

  const changeLang = async (lng: LOCALE) => {
    const { localSettings } = useUserStore.getState();

    i18n.changeLanguage(lng);
    userStore.setLocalSettings({ ...localSettings, uiLocale: lng });
    localStorage.setItem('refly-local-settings', safeStringifyJSON({ ...localSettings, uiLocale: lng }));

    // 不阻塞写回用户配置
    if (notShowLoginBtn) {
      const { data: res, error } = await getClient().updateSettings({
        body: { uiLocale: lng, outputLocale: localSettings.outputLocale },
      });

      if (error || !res.success) {
        message.error(t('settings.action.putErrorNotify'));
      }
    }
  };

  console.log('用户当前的界面语言', i18n.languages?.[0]);

  const dropList = (
    <Menu
      className={'ui-locale-list-menu'}
      onClickMenuItem={(key) => changeLang(key as LOCALE)}
      style={{ width: props?.width || 120 }}
    >
      <Menu.Item key="zh-CN" className={`ui-locale-list-menu-item ${i18n.languages?.[0] === 'zh-CN' ? 'active' : ''}`}>
        简体中文
      </Menu.Item>
      <Menu.Item key="en" className={`ui-locale-list-menu-item ${i18n.languages?.[0] === 'en' ? 'active' : ''}`}>
        English
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="ui-locale-list">
      <Dropdown droplist={dropList} trigger="click" position="bl">
        {props.children}
      </Dropdown>
    </div>
  );
};
