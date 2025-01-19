import { useTranslation } from 'react-i18next';
import { MenuProps, Dropdown } from 'antd';
import { LuSettings, LuLogOut, LuCircleHelp } from 'react-icons/lu';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useLogout } from '@refly-packages/ai-workspace-common/hooks/use-logout';
import { IconDiscord } from '@refly-packages/ai-workspace-common/components/common/icon';
import { PiVideoBold } from 'react-icons/pi';

export const SiderMenuSettingList = (props: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const { setShowSettingModal } = useSiderStoreShallow((state) => ({
    setShowSettingModal: state.setShowSettingModal,
  }));
  const { setShowTourModal } = useUserStoreShallow((state) => ({
    setShowTourModal: state.setShowTourModal,
  }));
  const { handleLogout, contextHolder } = useLogout();

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="px-4 py-1 cursor-text">
          <div className="text-sm font-semibold text-black">{userStore?.userProfile?.nickname}</div>
          <div className="text-xs text-gray-500 max-w-36 truncate">
            {userStore?.userProfile?.email ?? 'No email provided'}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <LuSettings />,
      label: t('loggedHomePage.siderMenu.settings'),
    },
    {
      key: 'documentation',
      icon: <LuCircleHelp />,
      label: t('loggedHomePage.siderMenu.documentation'),
    },
    {
      key: 'tour',
      icon: <PiVideoBold />,
      label: t('loggedHomePage.siderMenu.tour'),
    },
    {
      key: 'getHelp',
      icon: <IconDiscord />,
      label: t('loggedHomePage.siderMenu.getHelp'),
    },
    {
      key: 'logout',
      icon: <LuLogOut />,
      label: t('loggedHomePage.siderMenu.logout'),
    },
  ];

  const handleMenuClick = (key: string) => {
    if (key === 'documentation') {
      window.open(`https://docs.refly.ai`, '_blank');
    } else if (key === 'settings') {
      setShowSettingModal(true);
    } else if (key === 'tour') {
      setShowTourModal(true);
    } else if (key === 'logout') {
      handleLogout();
    } else if (key === 'getHelp') {
      window.open(`https://discord.gg/bWjffrb89h`, '_blank');
    }
  };

  return (
    <div>
      <Dropdown
        trigger={['click']}
        arrow={false}
        placement="bottom"
        menu={{
          items,
          onClick: ({ key }) => handleMenuClick(key),
          className: '[&_.ant-dropdown-menu-item-disabled]:!p-0',
        }}
      >
        {props.children}
      </Dropdown>
      {contextHolder}
    </div>
  );
};
