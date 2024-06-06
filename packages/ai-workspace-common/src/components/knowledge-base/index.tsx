import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { LeftAssistPanel } from './knowledge-base-detail';
import { ContentPanel } from './copilot';
// utils
// 自定义方法
// stores
// scss
import './index.scss';
import { useCookie } from 'react-use';
// types
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { getExtensionId } from '@refly-packages/ai-workspace-common/utils/url';
import { useTranslation } from 'react-i18next';

// 用于快速选择
export const quickActionList = ['summary'];

const KnowledgeLibrary = () => {
  const [token] = useCookie('_refly_ai_sid');

  const userStore = useUserStore();

  const { t } = useTranslation();

  const handleSendMsgToExtension = async (status: 'success' | 'failed', token?: string) => {
    try {
      await chrome.runtime.sendMessage(getExtensionId(), {
        name: 'refly-login-notify',
        body: {
          status,
          token,
        },
      });
    } catch (err) {
      console.log('handleSendMsgToExtension err', err);
    }

    console.log('dashboard close');
  };

  // TODO: 临时关闭，用于开发调试
  console.log('token', token);
  useEffect(() => {
    if (!(token || userStore?.userProfile?.uid)) return;

    const reflyLoginStatus = localStorage.getItem('refly-login-status');
    console.log('reflyLoginStatus', reflyLoginStatus, token);
    if ((token || userStore?.userProfile?.uid) && reflyLoginStatus) {
      // 从插件打开弹窗，给插件发消息
      handleSendMsgToExtension('success', token as string);
      localStorage.removeItem('refly-login-status');
      // localStorage.setItem(
      //   "refly-user-profile",
      //   safeStringifyJSON(userStore?.userProfile),
      // )
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }, [token, userStore?.userProfile?.uid]);

  return (
    <div className="workspace-container" style={{}}>
      <Helmet>
        <title>
          {t('productName')} | {t('landingPage.slogan')}
        </title>
        <meta name="description" content={t('landingPage.description')} />
      </Helmet>
      <div className="workspace-inner-container">
        <PanelGroup direction="horizontal" className="workspace-panel-container">
          <Panel minSize={50} className="workspace-left-assist-panel">
            <LeftAssistPanel />
          </Panel>
          <PanelResizeHandle className="workspace-panel-resize" />
          <Panel className="workspace-content-panel" defaultSize={30} minSize={30} maxSize={50}>
            <ContentPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default KnowledgeLibrary;
