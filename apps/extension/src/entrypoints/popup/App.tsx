import { Button, ConfigProvider, Spin, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getClientOrigin } from '@refly/utils/url';

import '@/styles/style.css';
import './App.scss';
import '@/i18n/config';

import { IconBulb, IconHome } from '@arco-design/web-react/icon';

import Logo from '@/assets/logo.svg';
import { browser } from 'wxt/browser';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { ContentClipper } from '@/components/content-clipper';
import { setRuntime } from '@refly/utils/env';
import { IconDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import { IoSettingsOutline } from 'react-icons/io5';

/**
 * 打开 popup 页面的规则
 * 1. 如果未登录，显示登录提示
 * 2. 如果已登录：
 *   2.1 如果页面不支持，显示不支持提示
 *   2.2 如果页面支持，显示 ContentClipper
 */
const App = () => {
  const { t } = useTranslation();
  const openSidePanelBtnRef = useRef<HTMLButtonElement | null>(null);
  const currentTabUrlRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [pageUnsupported, setPageUnsupported] = useState(false);
  // const { isLoggedIn } = useUserStore();
  const isLoggedIn = true;

  const refreshPage = async () => {
    const activeTab = await getCurrentTab();
    if (activeTab?.id) {
      await browser.tabs.reload(activeTab?.id);
      window.close();
    }
  };

  const openSidePanel = async () => {
    browser.runtime.sendMessage({
      type: 'registerSidePanel',
    });
  };

  const handleCheckPageUnsupport = () => {
    setTimeout(() => {
      setLoading(false);
      const pageUnsupported = checkPageUnsupported(currentTabUrlRef.current);
      setPageUnsupported(pageUnsupported);
    }, 100);
  };

  const handleViewCreate = async () => {
    const activeTab = await getCurrentTab();
    currentTabUrlRef.current = activeTab?.url || '';
    handleCheckPageUnsupport();
  };

  useEffect(() => {
    handleViewCreate();
    setRuntime('extension-sidepanel');
  }, []);

  if (loading)
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#00968F',
          },
        }}
      >
        <div className="popup-page loading-page">
          <div className="loading-content">
            <Spin size="large" />
            <p>{t('extension.popup.loading')}</p>
          </div>
        </div>
      </ConfigProvider>
    );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00968F',
          borderRadius: 6,
          controlItemBgActive: '#f1f1f0',
          controlItemBgActiveHover: '#e0e0e0',
        },
      }}
    >
      <div className="popup-page">
        <header>
          <div
            className="logo cursor-pointer"
            onClick={() => browser.tabs.create({ url: getClientOrigin() })}
          >
            <img className="logo-img" src={Logo} alt="Refly" />
            <span className="title">Refly</span>
          </div>
          <div className="guide-box">
            <Tooltip title={t('extension.popup.languageSettings')}>
              <Button
                className="mr-2"
                icon={<IoSettingsOutline />}
                onClick={() => {
                  browser.tabs.create({
                    url: `${getClientOrigin()}?openSettings=true&settingsTab=language`,
                  });
                }}
              />
            </Tooltip>
            <Button
              className="mr-2"
              icon={<IconHome />}
              onClick={() => {
                browser.tabs.create({ url: getClientOrigin() });
              }}
            />
            <Button
              icon={<IconDocument />}
              onClick={() => {
                browser.tabs.create({ url: 'https://docs.refly.ai' });
              }}
            />
          </div>
        </header>
        {!isLoggedIn ? (
          <div>
            <p className="content-title">{t('extension.popup.welcome')}</p>
            <p className="state">{t('extension.popup.pleaseLogin')}</p>
            <Button
              block
              type="primary"
              onClick={() => {
                browser.tabs.create({
                  url: `${getClientOrigin()}/login?from=refly-extension-login`,
                });
              }}
            >
              {t('extension.popup.loginRegister')}
            </Button>
          </div>
        ) : pageUnsupported ? (
          <div>
            <p className="content-title">{t('extension.popup.unsupportedTitle')}</p>
            <p className="state">{t('extension.popup.unsupportedDesc')}</p>
            <ul>
              <li>{t('extension.popup.unsupportedPages.chromeStore')}</li>
              <li>{t('extension.popup.unsupportedPages.chromePages')}</li>
              <li>{t('extension.popup.unsupportedPages.newTab')}</li>
            </ul>
            <p className="page-unsupported-hint">
              {t('extension.popup.unsupportedHint')} <span> 👉 </span>
              <a href="https://zh.wikipedia.org/wiki/ChatGPT" target="_blank" rel="noreferrer">
                {t('extension.popup.examplePage')}
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="content">
              <ContentClipper onSaveSuccess={() => {}} />
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
};

export default App;
