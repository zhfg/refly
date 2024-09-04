import { Tabs } from '@arco-design/web-react';
import { Helmet } from 'react-helmet';

// styles
import './index.scss';
// components
import { useTranslation } from 'react-i18next';

import { AccountSetting } from '@refly-packages/ai-workspace-common/components/settings/account-setting';
import { LanguageSetting } from '@refly-packages/ai-workspace-common/components/settings/language-setting';

const TabPane = Tabs.TabPane;

export const Settings = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="settings-container">
      <Helmet>
        <title>
          {t('productName')} | {t('tabMeta.settings.title')}
        </title>
      </Helmet>
      <div className="settings-inner-container">
        <div className="settings-title">{t('settings.title')}</div>
        <Tabs key="account" tabPosition="left" size="large">
          <TabPane key="account" className="settings-tab" title={t('settings.tabs.account')}>
            <AccountSetting />
          </TabPane>
          <TabPane key="language" className="settings-tab" title={t('settings.tabs.language')}>
            <LanguageSetting />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
