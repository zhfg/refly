import { useTranslation } from 'react-i18next';
import { Dropdown, MenuProps, message } from 'antd';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { LOCALE } from '@refly/common-types';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export const UILocaleList = (props: { children: React.ReactNode; width?: number }) => {
  const { t, i18n } = useTranslation();
  const userStore = useUserStore();

  const storageUserProfile = safeParseJSON(localStorage.getItem('refly-user-profile'));
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid;

  const changeLang = async (lng: LOCALE) => {
    const { localSettings } = useUserStore.getState();

    i18n.changeLanguage(lng);
    userStore.setLocalSettings({ ...localSettings, uiLocale: lng });
    localStorage.setItem('refly-local-settings', safeStringifyJSON({ ...localSettings, uiLocale: lng }));

    if (notShowLoginBtn) {
      const { data: res, error } = await getClient().updateSettings({
        body: { uiLocale: lng, outputLocale: localSettings.outputLocale },
      });

      if (error || !res.success) {
        message.error(t('settings.action.putErrorNotify'));
      }
    }
  };

  const dropList: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: '简体中文',
      onClick: () => changeLang('zh-CN' as LOCALE),
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => changeLang('en' as LOCALE),
    },
  ];

  return (
    <div>
      <Dropdown
        menu={{ selectedKeys: [i18n.languages?.[0]], items: dropList, style: { width: props?.width } }}
        trigger={['click']}
      >
        {props.children}
      </Dropdown>
    </div>
  );
};
