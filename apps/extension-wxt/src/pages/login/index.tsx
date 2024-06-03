import { Button } from '@arco-design/web-react';
import React, { useRef } from 'react';

// stores
import { useUserStore } from '@/stores/user';

// 静态资源
import Logo from '@/assets/logo.svg';
import { getClientOrigin } from '@/utils/url';
import { ChatHeader } from '@/components/home/header';
import { useTranslation } from 'react-i18next';
// styles
import './index.scss';

export const Login = () => {
  const userStore = useUserStore();
  const loginWindowRef = useRef<Window | null>();
  const { t } = useTranslation();

  /**
   * 0. 获取主站的登录态，如果没有登录就访问 Login 页面，已登录之后再展示可操作页面
   * 1. 打开一个弹窗，访问 Refly 主站进行登录
   * 2. 登录完之后，通过 chrome 的 API 给插件发消息，收到消息之后 reload 页面获取登录状态，然后持久化存储
   * 3. 之后带着 cookie or 登录状态去获取请求
   */
  const handleLogin = () => {
    // 提示正在登录
    userStore.setIsCheckingLoginStatus(true);

    const left = (screen.width - 1200) / 2;
    const top = (screen.height - 730) / 2;
    loginWindowRef.current = window.open(
      `${getClientOrigin()}/login?from=refly-extension-login`,
      '_blank',
      `location=no,toolbar=no,menubar=no,width=800,height=730,left=${left} / 2,top=${top} / 2`,
    );

    userStore.setIsCheckingLoginStatus(true);
  };

  return (
    <div className="login-container">
      <ChatHeader onlyShowClose />
      <div className="login-brand">
        <div className="login-branch-content" onClick={() => window.open(getClientOrigin(), '_blank')}>
          <img src={Logo} alt="Refly" style={{ width: 38, height: 38 }} />
          <span
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              display: 'inline-block',
              marginLeft: 8,
            }}
          >
            Refly
          </span>
        </div>
        <Button
          type="primary"
          onClick={() => handleLogin()}
          style={{ width: 260, height: 44, marginTop: 32 }}
          loading={userStore.isCheckingLoginStatus}
        >
          {userStore.isCheckingLoginStatus ? t('loginPage.loggingStatus') : t('loginPage.loginBtn')}
        </Button>
      </div>
    </div>
  );
};
