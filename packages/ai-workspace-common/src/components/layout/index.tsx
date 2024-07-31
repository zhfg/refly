import { Layout } from '@arco-design/web-react';
import { SiderLayout } from './sider';
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

// 组件
import { LoginModal } from '@refly-packages/ai-workspace-common/components/login-modal/index';

// stores
import { useBindCommands } from '@refly-packages/ai-workspace-common/hooks/use-bind-commands';

const Content = Layout.Content;

interface AppLayoutProps {
  children?: any;
}

export const AppLayout = (props: AppLayoutProps) => {
  // stores
  const userStore = useUserStore();

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
    </Layout>
  );
};
