import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

import { Dropdown, Menu, Modal, Avatar } from '@arco-design/web-react';
import { AiOutlineTwitter } from 'react-icons/ai';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { useState } from 'react';

// styles
import './index.scss';

export const SiderMenuMoreList = (props: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const iconStyle = {
    fontSize: 16,
    transform: 'translateY(3px)',
    marginRight: 8,
  };

  const dropList = (
    <Menu className="sider-menu-more-list-menu">
      <Menu.Item
        key="getHelp"
        onClick={() => {
          window.open(`https://twitter.com/tuturetom`, '_blank');
        }}
      >
        <AiOutlineTwitter style={iconStyle} />
        {t('loggedHomePage.siderMenu.getHelp')}
        <HiOutlineExternalLink className="hover-arrow" style={iconStyle} />
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="sider-menu-more-list">
      <Dropdown
        droplist={dropList}
        trigger="click"
        position="top"
        popupVisible={dropdownVisible}
        onVisibleChange={setDropdownVisible}
      >
        {props.children}
      </Dropdown>
    </div>
  );
};
