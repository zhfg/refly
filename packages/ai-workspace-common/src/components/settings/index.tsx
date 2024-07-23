import { Button, Modal, Typography } from '@arco-design/web-react';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { getClientOrigin, getCookieOrigin, getExtensionId } from '@refly/utils/url';
// components
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';
import { IconDown } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { OutputLocaleList } from '../output-locale-list';
import { LOCALE } from '@refly/common-types';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const Settings = () => {
  const [token, updateCookie, deleteCookie] = useCookie('_refly_ai_sid');
  const userStore = useUserStore();
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = userStore?.localSettings?.outputLocale;

  const handleLogout = () => {
    modal.confirm?.({
      title: t('settings.account.logoutConfirmation.title'),
      content: t('settings.account.logoutConfirmation.message'),
      onOk() {
        console.log('delete cookie');
        localStorage.removeItem('refly-user-profile');
        localStorage.removeItem('refly-local-settings');

        // 给插件发消息
        chrome.runtime?.sendMessage(getExtensionId(), {
          name: 'logout-notify',
        });

        deleteCookie();
        Cookies.remove('_refly_ai_sid', { domain: getCookieOrigin() });

        if (getRuntime() === 'web') {
          window.location.href = getClientOrigin(true); // 没有登录，直接跳转到登录页
        } else {
          navigate('/');
        }

        userStore.resetState();
      },
      onConfirm() {},
    });
  };

  return (
    <div className="settings-container">
      <Helmet>
        <title>
          {t('productName')} | {t('tabMeta.settings.title')}
        </title>
      </Helmet>
      <div className="settings-inner-container">
        <div className="settings-title">{t('settings.title')}</div>
        <div>
          <Typography.Title heading={4}>{t('settings.uiLocale.title')}</Typography.Title>
          <UILocaleList>
            <Button className="setting-page-language-btn" style={{ borderRadius: 16 }}>
              {t('language')} <IconDown />
            </Button>
          </UILocaleList>
        </div>
        <div>
          <Typography.Title heading={4}>{t('settings.outputLocale.title')}</Typography.Title>
          <Typography.Paragraph>{t('settings.outputLocale.description')}</Typography.Paragraph>
          <OutputLocaleList>
            <Button className="setting-page-language-btn" style={{ borderRadius: 16 }}>
              {localeToLanguageName?.[uiLocale]?.[outputLocale]} <IconDown />
            </Button>
          </OutputLocaleList>
        </div>
        <div>
          <Typography.Title heading={4}>{t('settings.account.title')}</Typography.Title>
          <Button onClick={() => handleLogout()} style={{ borderRadius: 16 }}>
            {t('settings.account.logout')}
          </Button>
        </div>
      </div>
      {contextHolder}
    </div>
  );
};
