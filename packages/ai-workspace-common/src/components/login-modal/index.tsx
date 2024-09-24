/**
 * 此为登录弹框，for web 使用
 */
import { Button, Modal, Divider, Typography } from '@arco-design/web-react';
import { useEffect, useRef } from 'react';
import { HiLanguage } from 'react-icons/hi2';

// stores
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
// storage

// 静态资源
import Logo from '@/assets/logo.svg';
import Google from '@/assets/google.svg';
import { Link, useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

// styles
import './index.scss';
import { useCookie } from 'react-use';
import { getServerOrigin, getClientOrigin } from '@refly/utils/url';
import { useTranslation } from 'react-i18next';
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';

export const LoginModal = (props: { visible?: boolean; from?: string }) => {
  const userStore = useUserStore((state) => ({
    setIsLogin: state.setIsLogin,
    isLogin: state.isLogin,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }));
  const navigate = useNavigate();
  const loginWindowRef = useRef<Window | null>();
  const [token, updateCookie, deleteCookie] = useCookie('_refly_ai_sid');

  const { t } = useTranslation();

  /**
   * 0. 获取主站的登录态，如果没有登录就访问 Login 页面，已登录之后再展示可操作页面
   * 1. 打开一个弹窗，访问 Refly 主站进行登录
   * 2. 登录完之后，通过 chrome 的 API 给插件发消息，收到消息之后 reload 页面获取登录状态，然后持久化存储
   * 3. 之后带着 cookie or 登录状态去获取请求
   */
  const handleLogin = () => {
    userStore.setIsLogin(true);
    location.href = `${getServerOrigin()}/v1/auth/google`;
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
        <Button
          className="login-btn"
          type="outline"
          onClick={() => handleLogin()}
          style={{ width: 260, height: 32, marginTop: 32, borderRadius: 4 }}
          loading={userStore.isLogin}
        >
          <img src={Google} alt="google" style={{ width: 15, height: 15, margin: '0 8px' }} />
          {userStore.isLogin ? t('landingPage.loginModal.loggingStatus') : t('landingPage.loginModal.loginBtn.google')}
        </Button>
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
