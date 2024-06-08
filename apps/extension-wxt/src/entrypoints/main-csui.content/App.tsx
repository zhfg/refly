import * as _Sentry from '@sentry/react';
import { useEffect, Suspense } from 'react';
import { MemoryRouter } from '@refly/ai-workspace-common/utils/router';
// 使用方法
import { useSwitchTheme } from '@/hooks/use-switch-theme';

// hooks
import { useProcessLoginNotify } from '@/hooks/use-process-login-notify';
// import { useRegisterMouseEvent } from "../hooks/use-register-mouse-event"
import { useBindCommands } from '@/hooks/use-bind-commands';
import { useSetContainerDimension } from '@/hooks/use-set-container-dimension';
// stores
import { useSiderStore } from '@/stores/sider';
import { useQuickActionStore } from '@/stores/quick-action';
import { useUserStore } from '@refly/ai-workspace-common/stores/user';

// 组件
import { Message, Spin } from '@arco-design/web-react';
import { AppRouter } from '@/routes/index';
import { Markdown } from '@/components/markdown';

// utils
import { checkPageUnsupported } from '@refly/ai-workspace-common/utils/extension/check';

// 加载国际化
import '@/i18n/config';
import { usePollingPingCurrentWeblink } from '@/hooks/use-polling-ping-current-weblink';
import { SENTRY_DSN } from '@/utils/url';
import { useSiderBarOpen } from '@/hooks/use-sider-bar-open';

// 样式
import '@/styles/style.css';
import './App.scss';
import { getPopupContainer } from '@refly/ai-workspace-common/utils/ui';
import { checkBrowserArc } from '@/utils/browser';
import { useChatStore } from '@refly/ai-workspace-common/stores/chat';
import { fakeMessages } from '../../fake-data/message';
// 设置 runtime 环境
import { getEnv, setRuntime } from '@refly/ai-workspace-common/utils/env';
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
  // 用于登录状态下，Ping 网页前置的处理状态
  usePollingPingCurrentWeblink();

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
    userStore.setRuntime('extension-sidepanel');
  }, []);

  const chatStore = useChatStore();

  useEffect(() => {
    chatStore.setMessages(fakeMessages as any);
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
          <MemoryRouter>
            <AppRouter />
          </MemoryRouter>
        </div>
      </div>
    </Suspense>
  );
};

export default Sentry.withProfiler(App);
