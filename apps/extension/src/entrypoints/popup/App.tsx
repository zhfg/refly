import { Button } from '@arco-design/web-react';
import { useEffect, useRef, useState } from 'react';

import { reflyEnv } from '@/utils/env';

import '@/styles/style.css';
import './App.scss';
import '@/i18n/config';

import { IconRefresh, IconBulb } from '@arco-design/web-react/icon';

import Logo from '@/assets/logo.svg';
import { browser } from 'wxt/browser';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { ContentClipper } from '@/components/content-clipper';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { setRuntime } from '@refly/utils/env';

/**
 * 打开 popup 页面的规则
 * 1. 如果未登录，显示登录提示
 * 2. 如果已登录：
 *   2.1 如果页面不支持，显示不支持提示
 *   2.2 如果页面支持，显示 ContentClipper
 */
const App = () => {
  const osType = reflyEnv.getOsType();
  const openSidePanelBtnRef = useRef<HTMLButtonElement>();
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

  if (loading) return null;

  if (!isLoggedIn) {
    return (
      <div className="popup-page">
        <header>
          <div className="logo">
            <img className="logo-img" src={Logo} alt="" />
            <span className="title">Refly</span>
          </div>
          <div className="guide-box">
            <Button
              type="outline"
              onClick={() => {
                browser.tabs.create({ url: 'https://refly.ai' });
              }}
            >
              教程
            </Button>
          </div>
        </header>
        <div>
          <p className="content-title">欢迎使用 Refly！</p>
          <p className="state">请先登录以使用完整功能</p>
          <Button
            long
            type="primary"
            onClick={() => {
              browser.tabs.create({ url: 'https://refly.ai/login' });
            }}
          >
            登录/注册
          </Button>
        </div>
      </div>
    );
  }

  if (pageUnsupported) {
    return (
      <div className="popup-page">
        <header>
          <div className="logo">
            <img className="logo-img" src={Logo} alt="" />
            <span className="title">Refly</span>
          </div>
          <div className="guide-box">
            <Button
              type="outline"
              onClick={() => {
                browser.tabs.create({ url: 'https://refly.ai' });
              }}
            >
              教程
            </Button>
          </div>
        </header>
        <div>
          <p className="content-title">感谢使用 Refly！</p>
          <p className="state">😵 由于浏览器安全限制，Refly 无法在以下页面工作：</p>
          <ul>
            <li>Chrome Web 商店页面</li>
            <li>Chrome 页面</li>
            <li>新标签页</li>
          </ul>
          <p className="page-unsupported-hint">
            您可以在另一个页面（
            <a href="https://zh.wikipedia.org/wiki/ChatGPT" target="_blank" rel="noreferrer">
              例如此页面
            </a>
            ）上尝试 Refly。
          </p>
          <Button
            ref={openSidePanelBtnRef}
            long
            type="primary"
            style={{ marginTop: 16 }}
            icon={<IconBulb />}
            onClick={() => openSidePanel()}
          >
            打开侧边栏提问
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-page">
      <header>
        <div className="logo">
          <img className="logo-img" src={Logo} alt="" />
          <span className="title">Refly</span>
        </div>
        <div className="guide-box">
          <Button
            type="outline"
            onClick={() => {
              browser.tabs.create({ url: 'https://refly.ai' });
            }}
          >
            教程
          </Button>
        </div>
      </header>
      <div className="content">
        <ContentClipper onSaveSuccess={() => {}} />
        <div className="footer">
          <Button
            ref={openSidePanelBtnRef}
            long
            type="primary"
            icon={<IconBulb />}
            onClick={() => openSidePanel()}
          >
            打开侧边栏提问
          </Button>
          <p className="shortcut-hint">
            提示：按下
            <span className="key">{osType === 'OSX' ? 'Command+J' : 'Ctrl+J'}</span>
            以更快地激活 Refly。键盘快捷键可以在
            <Button
              type="text"
              className="shortcut-link"
              onClick={() => {
                browser.tabs.create({
                  url: 'chrome://extensions/shortcuts',
                });
              }}
            >
              此处
            </Button>
            更改。
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
