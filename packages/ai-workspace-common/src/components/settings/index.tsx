import { Tabs, Modal } from 'antd';

// components
import { useTranslation } from 'react-i18next';

import { AccountSetting } from '@refly-packages/ai-workspace-common/components/settings/account-setting';
import { LanguageSetting } from '@refly-packages/ai-workspace-common/components/settings/language-setting';
import { Subscription } from '@refly-packages/ai-workspace-common/components/settings/subscription';

import { RiAccountBoxLine } from 'react-icons/ri';
import { HiOutlineLanguage } from 'react-icons/hi2';
import { MdOutlineSubscriptions } from 'react-icons/md';

import './index.scss';

const iconStyle = { fontSize: 16, transform: 'translateY(3px)' };

interface SettingModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}
export const SettingModal = (props: SettingModalProps) => {
  const { visible, setVisible } = props;
  const { t } = useTranslation();

  const tabs = [
    {
      key: 'subscription',
      label: t('settings.tabs.subscription'),
      icon: <MdOutlineSubscriptions style={iconStyle} />,
      children: <Subscription />,
    },
    {
      key: 'account',
      label: t('settings.tabs.account'),
      icon: <RiAccountBoxLine style={iconStyle} />,
      children: <AccountSetting />,
    },
    {
      key: 'language',
      label: t('settings.tabs.language'),
      icon: <HiOutlineLanguage style={iconStyle} />,
      children: <LanguageSetting />,
    },
  ];

  return (
    <Modal
      className="settings-modal"
      centered
      width={950}
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
    >
      <Tabs size="large" tabPosition="left" items={tabs} />
    </Modal>
  );
};
