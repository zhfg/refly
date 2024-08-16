import { Button, Spin } from '@arco-design/web-react';
import { useEffect, useRef, useState } from 'react';

import { reflyEnv } from '@/utils/env';

import '@/styles/style.css';
import './App.scss';

import { IconRefresh, IconBulb } from '@arco-design/web-react/icon';

import Logo from '@/assets/logo.svg';
import { useStorage } from '@/hooks/use-storage';
import { browser } from 'wxt/browser';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';

/**
 * 打开 popup 页面的规则
 * 1. 如果是
 */
const App = () => {
  const osType = reflyEnv.getOsType();
  const openSidePanelBtnRef = useRef<HTMLButtonElement>();
  const [isSideBarOpen, setIsSideBarOpen] = useStorage<boolean>('isSideBarOpen', false, 'sync');

  const [currentTabUrl, setCurrentTabUrl] = useState('');
  const currentTabUrlRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [pageUnsupported, setPageUnsupported] = useState(false);

  const refreshPage = async () => {
    const activeTab = await getCurrentTab();

    if (activeTab?.id) {
      await browser.tabs.reload(activeTab?.id);
      window.close();
    }
  };

  const openSidePanel = async () => {
    console.log('clicked');
    const currentTab = await getCurrentTab();
    // @ts-ignore
    // await browser?.sidePanel?.open({
    //   windowId: currentTab?.windowId,
    // });
    browser.runtime.sendMessage({
      type: 'registerSidePanel',
    });

    // setTimeout(() => {
    //   window.close();
    // });
    return;
  };

  const handleToggleCopilot = async () => {
    const activeTab = await getCurrentTab();
    setCurrentTabUrl(activeTab?.url || '');
    currentTabUrlRef.current = activeTab?.url || '';

    if (activeTab) {
      const res = await browser.tabs.sendMessage(activeTab?.id as number, {
        name: 'toggleCopilotFromPopup',
        toggle: !isSideBarOpen,
      });

      setIsSideBarOpen(!isSideBarOpen);

      setTimeout(() => {
        if (res) {
          window.close();
        }
      });
    }
  };

  const handleCheckPageUnsupport = () => {
    setTimeout(() => {
      setLoading(false);
      const pageUnsupported = checkPageUnsupported(currentTabUrlRef.current);
      setPageUnsupported(pageUnsupported);
    }, 100);
  };

  const handleViewCreate = async () => {
    await handleToggleCopilot();
    handleCheckPageUnsupport();
  };

  useEffect(() => {
    handleViewCreate();
  }, []);

  if (loading) return null;

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
        {pageUnsupported ? (
          <>
            <p className="state">😵 由于浏览器安全限制，Refly 无法在以下页面工作：</p>
            <ul>
              <li>Chrome Web 商店页面</li>
              <li>Chrome 页面</li>
              <li>新标签页</li>
            </ul>
            <p className="page-unsupported-hint">
              您可以在另一个页面（
              <a href="https://zh.wikipedia.org/wiki/ChatGPT" target="_blank">
                例如此页面
              </a>
              ）上尝试 Refly。
            </p>
          </>
        ) : (
          <>
            <p className="state">😵 你需要刷新此页面来让 Refly 正常工作</p>
            <Button long icon={<IconRefresh />} onClick={refreshPage}>
              刷新此页面
            </Button>
          </>
        )}
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
        <p className="shortcut-hint">
          提示：按下
          <span className="key">{osType === 'OSX' ? 'Command+J' : 'Ctrl+J'}</span>
          以更快地激活 Refly。键盘快捷键可以在
          <a
            onClick={() => {
              browser.tabs.create({
                url: `chrome://extensions/shortcuts`,
              });
            }}
          >
            此处
          </a>
          更改。
        </p>
      </div>
    </div>
  );
};

export default App;
