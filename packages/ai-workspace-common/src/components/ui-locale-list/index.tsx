import { useTranslation } from 'react-i18next';
import { Dropdown, Menu, Message as message } from '@arco-design/web-react';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { LOCALE } from '@refly-packages/ai-workspace-common/types';
// request
import putUserInfo from '@refly-packages/ai-workspace-common/requests/putUserInfo';
// styles
import './index.scss';

export const UILocaleList = (props: { children: any }) => {
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
      const res = await putUserInfo({
        body: { uiLocale: lng, outputLocale: localSettings.outputLocale },
      });

      if (!res.success) {
        message.error(t('settings.action.putErrorNotify'));
      }
    }
  };

  console.log('用户当前的界面语言', i18n.languages?.[0]);

  const dropList = (
    <Menu className={'ui-locale-list-menu'} onClickMenuItem={(key) => changeLang(key as LOCALE)} style={{ width: 120 }}>
      <Menu.Item key="zh-CN">简体中文</Menu.Item>
      <Menu.Item key="en">English</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown droplist={dropList} position="bl">
      {props.children}
    </Dropdown>
  );
};
