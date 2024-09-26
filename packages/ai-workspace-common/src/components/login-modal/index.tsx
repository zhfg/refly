import { Button, Modal, Divider, Typography } from '@arco-design/web-react';
import { HiLanguage } from 'react-icons/hi2';

// stores
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
// storage

// 静态资源
import Logo from '@/assets/logo.svg';
import Google from '@/assets/google.svg';
import GitHub from '@/assets/github-mark.svg';
import { Link, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

// styles
import './index.scss';
import { getServerOrigin, getClientOrigin } from '@refly/utils/url';
import { useTranslation } from 'react-i18next';
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';

export const LoginModal = (props: { visible?: boolean; from?: string }) => {
  const userStore = useUserStore((state) => ({
    setIsLogin: state.setIsLogin,
    setLoginProvider: state.setLoginProvider,
    isLogin: state.isLogin,
    loginProvider: state.loginProvider,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }));

  const { t } = useTranslation();

  /**
   * 0. Get the login status from the main site. If not logged in, visit the Login page; after logging in, display the home page
   * 1. Open a modal to access the Refly main site for login
   * 2. After logging in, use Chrome's API to send a message to the extension. Upon receiving the message, reload the page to get the login status, then persist it
   * 3. Subsequently, make requests with the cookie or login status
   */
  const handleLogin = (provider: 'github' | 'google') => {
    userStore.setIsLogin(true);
    userStore.setLoginProvider(provider);
    location.href = `${getServerOrigin()}/v1/auth/${provider}`;
  };

  // props
  let modalProps: any = {};

  if (props.visible) {
    modalProps = {
      visible: true,
      closable: false,
      maskClosable: false,
      maskStyle: {
        backgroundColor: '#F3F3EE',
        opacity: 1,
      },
    };
  } else {
    modalProps = {
      visible: userStore?.loginModalVisible,
    };
  }

  return (
    <Modal
      {...modalProps}
      footer={null}
      className="login-modal"
      autoFocus={false}
      wrapStyle={{
        borderRadius: 8,
      }}
      onCancel={() => userStore.setLoginModalVisible(false)}
    >
      <div className="login-container">
        <div className="language-btn">
          <UILocaleList>
            <Button type="text" icon={<HiLanguage style={{ fontSize: 20 }} />}></Button>
          </UILocaleList>
        </div>
        <div className="login-brand">
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
        <div className="login-hint-text">{t('landingPage.loginModal.title')}</div>
        <div className="login-btn-group">
          <Button
            className="login-btn"
            type="outline"
            onClick={() => handleLogin('github')}
            style={{ width: 260, height: 32 }}
            loading={userStore.isLogin && userStore.loginProvider === 'github'}
            disabled={userStore.isLogin && userStore.loginProvider !== 'github'}
          >
            <img src={GitHub} alt="github" />
            {userStore.isLogin && userStore.loginProvider === 'github'
              ? t('landingPage.loginModal.loggingStatus')
              : t('landingPage.loginModal.loginBtn.github')}
          </Button>
          <Button
            className="login-btn"
            type="outline"
            onClick={() => handleLogin('google')}
            style={{ width: 260, height: 32 }}
            loading={userStore.isLogin && userStore.loginProvider === 'google'}
            disabled={userStore.isLogin && userStore.loginProvider !== 'google'}
          >
            <img src={Google} alt="google" />
            {userStore.isLogin && userStore.loginProvider === 'google'
              ? t('landingPage.loginModal.loggingStatus')
              : t('landingPage.loginModal.loginBtn.google')}
          </Button>
        </div>
        <Divider></Divider>
        <Typography.Paragraph className="term-text">
          {t('landingPage.loginModal.utilText')}
          <Link
            to={`${getClientOrigin(true)}/terms`}
            style={{ margin: '0 4px' }}
            onClick={() => {
              userStore.setLoginModalVisible(false);
            }}
          >
            <Typography.Text underline>{t('landingPage.loginModal.terms')}</Typography.Text>
          </Link>
          {t('landingPage.loginModal.and')}
          <Link
            to={`${getClientOrigin(true)}/privacy`}
            style={{ margin: '0 4px' }}
            onClick={() => {
              userStore.setLoginModalVisible(false);
            }}
          >
            <Typography.Text underline>{t('landingPage.loginModal.privacyPolicy')}</Typography.Text>
          </Link>
        </Typography.Paragraph>
      </div>
    </Modal>
  );
};
