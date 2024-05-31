import React, { useEffect } from 'react';
import { Layout } from '@arco-design/web-react';
import { SiderLayout } from './sider';
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

// request
import getUserInfo from '@refly-packages/ai-workspace-common/requests/getUserInfo';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

// 组件
import { LoginModal } from '@refly-packages/ai-workspace-common/components/login-modal/index';
import { useCookie } from 'react-use';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { QuickSearchModal } from '@refly-packages/ai-workspace-common/components/quick-search-modal';

// stores
import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { useBindCommands } from '@refly-packages/ai-workspace-common/hooks/use-bind-commands';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly-packages/ai-workspace-common/types';

const Content = Layout.Content;

interface AppLayoutProps {
  children?: any;
}

export const AppLayout = (props: AppLayoutProps) => {
  // stores
  const userStore = useUserStore();
  const quickSearchStateStore = useQuickSearchStateStore();

  // 绑定快捷键
  useBindCommands();

  return (
    <Layout className="app-layout main">
      <SiderLayout />
      <Layout
        className="content-layout"
        style={{
          height: 'calc(100vh - 16px)',
          flexGrow: 1,
          overflowY: 'scroll',
          width: `calc(100% - 200px - 16px)`,
        }}
      >
        <Content>{props.children}</Content>
      </Layout>
      {userStore.loginModalVisible ? <LoginModal /> : null}
      {quickSearchStateStore.visible ? <QuickSearchModal /> : null}
    </Layout>
  );
};
