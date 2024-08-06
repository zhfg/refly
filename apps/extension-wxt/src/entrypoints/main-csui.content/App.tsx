import * as _Sentry from '@sentry/react';
import { useEffect, Suspense } from 'react';
// 使用方法
import { useSwitchTheme } from '@/hooks/use-switch-theme';

// hooks
import { useProcessLoginNotify } from '@/hooks/use-process-login-notify';
// import { useRegisterMouseEvent } from "../hooks/use-register-mouse-event"
import { useBindCommands } from '@/hooks/use-bind-commands';
import { useSetContainerDimension } from '@/hooks/use-set-container-dimension';
// stores
import { useSiderStore } from '@refly-packages/ai-workspace-common/stores/sider';
import { useQuickActionStore } from '@/stores/quick-action';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

// 组件
import { Message, Spin } from '@arco-design/web-react';
import { AppRouter } from '@/routes/index';

// utils
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';

// 加载国际化
import '@/i18n/config';
import { SENTRY_DSN } from '@refly/utils/url';
import { useSiderBarOpen } from '@/hooks/use-sider-bar-open';

// 样式
import '@/styles/style.css';
import './App.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { checkBrowserArc } from '@/utils/browser';
// 设置 runtime 环境
import { getEnv, setRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSyncWeblinkResourceMeta } from '@/hooks/content-scripts/use-get-weblink-resource-meta';
import { useMockInAppResource } from '@/hooks/use-mock-in-app-resource';
const Sentry = _Sentry;

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: getEnv(),
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    tracePropagationTargets: ['localhost', 'https://refly.ai'],
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0,
  });
}

const App = () => {
  // 打开聊天窗口的方式
  const siderStore = useSiderStore();
  const quickActionStore = useQuickActionStore();

  const userStore = useUserStore();

  // 注册 mouse event
  // useRegisterMouseEvent()
  // 监听打开与关闭侧边栏消息
  useSiderBarOpen();
  // 绑定快捷键，后续允许用户自定义快捷键
  useBindCommands();
  // 设定主题样式
  useSwitchTheme();
  // 在激活侧边栏时，设置可操作的空间 Dimension，可以使得组件库效果展示好
  useSetContainerDimension();
  // 处理登录状态
  useProcessLoginNotify();
  // 在挂载时记录当前资源,Only for Content Script
  useSyncWeblinkResourceMeta();
  // 在网页时，模拟在知识库的资源选中状态
  useMockInAppResource();

  // 设置 Message 通知的 container
  useEffect(() => {
    Message.config({
      getContainer: () => getPopupContainer() as HTMLElement,
    });
  }, []);
  useEffect(() => {
    /**
     * 如果决定是否使用 SidePanel 还是 Content Script UI？
     *
     * 1. 如果页面支持 CSUI 注入，判断是否是 Arc，直接处理
     * 2. 如果不支持 CSUI 注入，比如 extension://url，则打开 Popup 要求跳转到支持页面，然后处理
     */
    if (!checkPageUnsupported(location.href)) {
      checkBrowserArc();
    }
    setRuntime('extension-csui');
    userStore.setRuntime('extension-csui');
  }, []);

  return (
    <Suspense fallback={<Spin style={{ marginTop: '200px auto' }} />}>
      <div className="light app-container">
        {/* <div
        className={quickActionStore.selectedText ? "entry active" : "entry"}
        onClick={(_) => siderStore.setShowSider(!siderStore.showSider)}>
        <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
        <span>⌘B</span>
      </div> */}
        <div id="refly-app-main" className={siderStore.showSider ? 'main active' : 'main'}>
          <AppRouter />
        </div>
      </div>
    </Suspense>
  );
};

export default Sentry.withProfiler(App);
