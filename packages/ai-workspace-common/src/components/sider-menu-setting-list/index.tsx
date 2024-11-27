import { useTranslation } from 'react-i18next';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { getCookieOrigin, getExtensionId } from '@refly/utils/url';
import { Menu, Modal, Avatar } from '@arco-design/web-react';
import { Popover } from 'antd';
import { LuSettings, LuLogOut } from 'react-icons/lu';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';

// styles
import './index.scss';
import { AiOutlineTwitter } from 'react-icons/ai';

export const SiderMenuSettingList = (props: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const { setShowSettingModal } = useSiderStoreShallow((state) => ({
    setShowSettingModal: state.setShowSettingModal,
  }));
  const [modal, contextHolder] = Modal.useModal();
  const [deleteCookie] = useCookie('_refly_ai_sid');

  const handleLogout = () => {
    modal.confirm?.({
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      title: t('settings.account.logoutConfirmation.title'),
      content: t('settings.account.logoutConfirmation.message'),
      onOk() {
        console.log('delete cookie');
        localStorage.removeItem('refly-user-profile');
        localStorage.removeItem('refly-local-settings');

        // 给插件发消息
        chrome.runtime?.sendMessage(getExtensionId(), {
          name: 'external-refly-logout-notify',
        });

        deleteCookie();
        Cookies.remove('_refly_ai_sid', { domain: getCookieOrigin() });

        window.location.reload();

        userStore.resetState();
      },
      onConfirm() {},
    });
  };

  const handleMenuClick = (key: string) => {
    if (key === 'settings') {
      setShowSettingModal(true);
    } else if (key === 'logout') {
      handleLogout();
    }
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
          selectedKeys={[]}
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
          <Menu.Item
            key="getHelp"
            onClick={() => {
              window.open(`https://twitter.com/tuturetom`, '_blank');
            }}
          >
            <AiOutlineTwitter
              style={{
                fontSize: 16,
                transform: 'translateY(3px)',
                marginRight: 8,
              }}
            />
            {t('loggedHomePage.siderMenu.getHelp')}
          </Menu.Item>
        </Menu>
      </div>
    </div>
  );

  return (
    <div className="sider-menu-setting-list">
      <Popover
        zIndex={12}
        overlayInnerStyle={{ padding: 0, backgroundColor: 'transparent', boxShadow: 'none' }}
        arrow={false}
        placement="bottom"
        content={dropList}
      >
        {props.children}
      </Popover>
      {contextHolder}
    </div>
  );
};
