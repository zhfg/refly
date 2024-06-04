import * as _Sentry from '@sentry/react';
import { useEffect, Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
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

// 组件
import { Message, Spin } from '@arco-design/web-react';
import { ContentRouter } from '@/components/router';
import { Markdown } from '@/components/markdown';

// 加载国际化
import '@/i18n/config';
import { usePollingPingCurrentWeblink } from '@/hooks/use-polling-ping-current-weblink';
import { getEnv } from '@/utils/env';
import { SENTRY_DSN } from '@/utils/url';
import { useSiderBarOpen } from '@/hooks/use-sider-bar-open';

// 样式
import '@/styles/style.css';
import './App.scss';
import { getPopupContainer } from '../../utils/ui';
import { checkBrowserArc } from '@/utils/browser';

const Sentry = _Sentry;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: getEnv(),
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  tracePropagationTargets: ['localhost', 'https://refly.ai'],
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0,
});

const App = () => {
  // 打开聊天窗口的方式
  const siderStore = useSiderStore();
  const quickActionStore = useQuickActionStore();

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
    checkBrowserArc();
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
            <ContentRouter getPopupContainer={() => getPopupContainer()} />
          </MemoryRouter>
        </div>
      </div>
    </Suspense>
  );
};

export default Sentry.withProfiler(App);
