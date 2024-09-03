import { useTranslation } from 'react-i18next';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { getClientOrigin, getCookieOrigin, getExtensionId } from '@refly/utils/url';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

import { Dropdown, Menu, Modal, Avatar } from '@arco-design/web-react';
import { LuSettings, LuLogOut } from 'react-icons/lu';
import { useState } from 'react';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

// styles
import './index.scss';

export const SiderMenuSettingList = (props: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const userStore = useUserStore();
  const [modal, contextHolder] = Modal.useModal();
  const [token, updateCookie, deleteCookie] = useCookie('_refly_ai_sid');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = () => {
    modal.confirm?.({
      title: t('settings.account.logoutConfirmation.title'),
      content: t('settings.account.logoutConfirmation.message'),
      onOk() {
        console.log('delete cookie');
        localStorage.removeItem('refly-user-profile');
        localStorage.removeItem('refly-local-settings');

        // 给插件发消息
        chrome.runtime?.sendMessage(getExtensionId(), {
          name: 'logout-notify',
        });

        deleteCookie();
        Cookies.remove('_refly_ai_sid', { domain: getCookieOrigin() });

        if (getRuntime() === 'web') {
          window.location.href = getClientOrigin(true); // 没有登录，直接跳转到登录页
        } else {
          navigate('/');
        }

        userStore.resetState();
      },
      onConfirm() {},
    });
  };

  const handleMenuClick = (key: string) => {
    if (key === 'settings') {
      navigate('/settings');
    } else if (key === 'logout') {
      handleLogout();
    }
    setDropdownVisible(false);
  };

  const dropList = (
    <div className="sider-menu-setting-list-drop-list">
      <div className="sider-menu-setting-list-drop-list-content">
        <div className="profile">
          <Avatar className="avatar" size={32}>
            <img alt="avatar" src={userStore?.userProfile?.avatar} />
          </Avatar>
          <div className="username">
            <div className="nickname">{userStore?.userProfile?.nickname}</div>
            <div className="email">{userStore?.userProfile?.email}</div>
          </div>
        </div>
        <Menu
          className={'sider-menu-setting-list-menu'}
          defaultSelectedKeys={location.pathname === '/settings' ? ['settings'] : []}
          onClickMenuItem={(key) => handleMenuClick(key)}
        >
          <Menu.Item key="settings">
            <LuSettings style={{ transform: 'translateY(2px)', marginRight: 8 }} />
            {t('loggedHomePage.siderMenu.settings')}
          </Menu.Item>
          <Menu.Item key="logout">
            <LuLogOut style={{ transform: 'translateY(2px)', marginRight: 8 }} />
            {t('loggedHomePage.siderMenu.logout')}
          </Menu.Item>
        </Menu>
      </div>
    </div>
  );

  return (
    <div className="sider-menu-setting-list">
      <Dropdown
        droplist={dropList}
        trigger="click"
        position="top"
        popupVisible={dropdownVisible}
        onVisibleChange={setDropdownVisible}
      >
        {props.children}
      </Dropdown>
      {contextHolder}
    </div>
  );
};
