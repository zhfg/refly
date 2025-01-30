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
import { Unsupported } from '@/entrypoints/popup/unsupported';
import { LoginHeader } from '@/entrypoints/popup/login-header';
import { NotLogged } from '@/entrypoints/popup/not-logged';
import { LoadLoading } from '@/entrypoints/popup/load-loading';
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

  if (loading) return <LoadLoading />;

  return (
    <div className="popup-page">
      <LoginHeader />
      {pageUnsupported ? (
        <Unsupported />
      ) : (
        <>
          <div className="content">
            <ContentClipper onSaveSuccess={() => {}} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
