import React, { useEffect } from 'react';
import { useNavigate, useMatch } from '@refly-packages/ai-workspace-common/utils/router';
import classNames from 'classnames';
import { IconSearch, IconStorage } from '@arco-design/web-react/icon';
// stores
import { useUserStore } from '@/stores/user';
import { useHomeStateStore } from '@/stores/home-state';
import { useSelectedMark } from '@/hooks/use-selected-mark';
import { useTranslation } from 'react-i18next';
import { useGetUserSettings } from '@/hooks/use-get-user-settings';
import { LOCALE } from '@/types';
// components
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot';
import { EmptyFeedStatus } from '@refly-packages/ai-workspace-common/components/empty-feed-status';
// utils
import { useResizePanel } from '@refly-packages/ai-workspace-common/hooks/use-resize-panel';
import Home from './home';
import { ErrorBoundary } from '@sentry/react';
// styles
import './router.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface ContentRouterProps {}

export const ContentRouter = (props: ContentRouterProps) => {
  // 导航相关
  const navigate = useNavigate();
  const userStore = useUserStore();

  const homeStateStore = useHomeStateStore();
  const { handleResetState } = useSelectedMark();

  const [minSize] = useResizePanel({
    getGroupSelector: () => {
      const rootElem = getPopupContainer();
      return rootElem.querySelector('.workspace-panel-container') as HTMLElement;
    },
    getResizeSelector: () => {
      const rootElem = getPopupContainer();
      return rootElem.querySelectorAll('.workspace-panel-resize') as NodeListOf<HTMLElement>;
    },
    initialMinSize: 24,
    initialMinPixelSize: 310,
  });

  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // 获取 locale
  const locale = userStore?.localSettings?.uiLocale || LOCALE.EN;

  // 这里处理 user 登录和状态管理
  useGetUserSettings();
  // 进行保活检查

  // TODO: 国际化相关内容
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  const noteId = '';
  const copilotStyle = noteId
    ? {
        defaultSize: 20,
        minSize: 20,
        maxSize: 50,
      }
    : {
        defaultSize: 100,
        minSize: 100,
        maxSize: 100,
      };

  return (
    <div className="workspace-container">
      <div className="workspace-inner-container">
        <ErrorBoundary>
          <AICopilot />
        </ErrorBoundary>
      </div>
    </div>
  );
};
