import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import { getClientOrigin } from '@refly/utils/url';

import '@/styles/style.css';
import './App.scss';
import '@/i18n/config';

import { IconHome } from '@arco-design/web-react/icon';

import Logo from '@/assets/logo.svg';
import { browser } from 'wxt/browser';
import { IconDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import { IoSettingsOutline } from 'react-icons/io5';

export const LoginHeader = () => {
  const { t } = useTranslation();
  return (
    <header>
      <div
        className="logo cursor-pointer"
        onClick={() => browser.tabs.create({ url: getClientOrigin() })}
      >
        <img className="logo-img" src={Logo} alt="Refly" />
        <span className="title">Refly</span>
      </div>
      <div className="guide-box">
        <Tooltip title={t('extension.popup.languageSettings')}>
          <Button
            className="mr-2"
            icon={<IoSettingsOutline />}
            onClick={() => {
              browser.tabs.create({
                url: `${getClientOrigin()}?openSettings=true&settingsTab=language`,
              });
            }}
          />
        </Tooltip>
        <Tooltip title={t('extension.popup.home')}>
          <Button
            className="mr-2"
            icon={<IconHome />}
            onClick={() => {
              browser.tabs.create({ url: getClientOrigin() });
            }}
          />
        </Tooltip>

        <Tooltip title={t('extension.popup.docs')}>
          <Button
            icon={<IconDocument />}
            onClick={() => {
              browser.tabs.create({ url: 'https://docs.refly.ai' });
            }}
          />
        </Tooltip>
      </div>
    </header>
  );
};
