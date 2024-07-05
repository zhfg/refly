// 静态资源
import Logo from '@/assets/logo.svg';
import CloseGraySVG from '@/assets/side/close.svg';
import NotificationSVG from '@/assets/side/notification.svg';
import SettingGraySVG from '@/assets/side/setting.svg';
import FullScreenSVG from '@/assets/side/full-screen.svg';

// 组件
import { IconTip } from './icon-tip';
import { Avatar } from '@arco-design/web-react';
// stores
import { useSiderStore } from '@refly/ai-workspace-common/stores/sider';
import { useNavigate } from '@refly/ai-workspace-common/utils/router';
import { getClientOrigin } from '@refly/utils/url';
import { useUserStore } from '@/stores/user';
import { useHomeStateStore } from '@/stores/home-state';
import { useSelectedMark } from '@/hooks/use-selected-mark';
import { useTranslation } from 'react-i18next';

export const ChatHeader = (props: { onlyShowClose?: boolean }) => {
  const { onlyShowClose = false } = props;
  const siderStore = useSiderStore();
  const navigate = useNavigate();
  const { userProfile } = useUserStore();
  const homeStateStore = useHomeStateStore();
  const { handleResetState } = useSelectedMark();

  const { t } = useTranslation();

  const showBtn = !!userProfile?.uid;

  return (
    <header style={{ padding: `0 12px` }}>
      <div
        className="brand"
        onClick={() => {
          window.open(`${getClientOrigin()}/`, '_blank');
          homeStateStore.setActiveTab('home');
        }}
      >
        <>
          <img src={Logo} alt="Refly" />
          <span>Refly</span>
        </>
      </div>
      <div className="funcs">
        <IconTip text={t('extension.loggedHomePage.homePage.header.fullscreen')}>
          <img
            src={FullScreenSVG}
            alt={t('extension.loggedHomePage.homePage.header.fullscreen')}
            style={{ marginRight: 12 }}
            onClick={() => window.open(`${getClientOrigin()}/`, '_blank')}
          />
        </IconTip>
        {/* <IconTip text="通知">
                <img src={NotificationSVG} alt="通知" />
            </IconTip> */}
        {showBtn && !onlyShowClose && (
          <IconTip text={t('extension.loggedHomePage.homePage.header.settings')}>
            <img
              src={SettingGraySVG}
              alt={t('extension.loggedHomePage.homePage.header.settings')}
              style={{ marginRight: 12 }}
              onClick={() => window.open(`${getClientOrigin()}/settings`, '_blank')}
            />
          </IconTip>
        )}
        {showBtn && !onlyShowClose && (
          <IconTip text={t('extension.loggedHomePage.homePage.header.account')}>
            <Avatar size={16} style={{ marginRight: 12 }}>
              <img
                alt="avatar"
                src={userProfile?.avatar}
                onClick={() => window.open(`${getClientOrigin()}/settings`, '_blank')}
              />
            </Avatar>
          </IconTip>
        )}
        <IconTip text={t('extension.loggedHomePage.homePage.header.close')}>
          <img
            src={CloseGraySVG}
            alt={t('extension.loggedHomePage.homePage.header.close')}
            onClick={(_) => {
              siderStore.setShowSider(false);
              handleResetState();
            }}
          />
        </IconTip>
      </div>
    </header>
  );
};
