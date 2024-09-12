import { Tabs } from '@arco-design/web-react';
import { Helmet } from 'react-helmet';

// styles
import './index.scss';
// components
import { useTranslation } from 'react-i18next';

import { AccountSetting } from '@refly-packages/ai-workspace-common/components/settings/account-setting';
import { LanguageSetting } from '@refly-packages/ai-workspace-common/components/settings/language-setting';
import { Subscription } from '@refly-packages/ai-workspace-common/components/settings/subscription';

import { RiAccountBoxLine } from 'react-icons/ri';
import { HiOutlineLanguage } from 'react-icons/hi2';
import { MdOutlineSubscriptions } from 'react-icons/md';

const TabPane = Tabs.TabPane;
const iconStyle = { fontSize: 16, marginRight: 8 };

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
          <TabPane
            key="account"
            className="settings-tab"
            title={
              <span className="settings-tab-title">
                <RiAccountBoxLine style={iconStyle} />
                {t('settings.tabs.account')}
              </span>
            }
          >
            <AccountSetting />
          </TabPane>

          <TabPane
            key="subscription"
            className="settings-tab"
            title={
              <span className="settings-tab-title">
                <MdOutlineSubscriptions style={iconStyle} />
                {t('settings.tabs.subscription')}
              </span>
            }
          >
            <Subscription />
          </TabPane>

          <TabPane
            key="language"
            className="settings-tab"
            title={
              <span className="settings-tab-title">
                <HiOutlineLanguage style={iconStyle} />
                {t('settings.tabs.language')}
              </span>
            }
          >
            <LanguageSetting />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
