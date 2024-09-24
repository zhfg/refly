import React, { useEffect } from 'react';

import { LoginModal } from '../login-modal/index';
import { useSearchParams } from 'react-router-dom';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const isFromExtension = searchParams.get('from') === 'refly-extension-login';

  // 来自插件页面登录跳转，打个标，然后后续基于这个标做状态控制
  useEffect(() => {
    console.log('refly-login-status', localStorage.getItem('refly-login-status'), isFromExtension);
    if (isFromExtension) {
      localStorage.setItem('refly-login-status', 'true');
    } else {
      // 不是插件打开的页面，就直接清除状态，区分插件和普通页面打开
      localStorage.removeItem('refly-login-status');
    }
  }, [isFromExtension]);

  return (
    <>
      <LoginModal visible={true} from="extension-login" />
    </>
  );
};
