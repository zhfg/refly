import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { KnowledgeBaseDetail } from '@refly/ai-workspace-common/components/knowledge-base/knowledge-base-detail';
import { AICopilot } from '@refly/ai-workspace-common/components/knowledge-base/copilot';
// utils
// 自定义方法
// stores
// scss
import './index.scss';
// types
import { useUserStore } from '@refly/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useResizePanel } from '@refly/ai-workspace-common/hooks/use-resize-panel';
import { ErrorBoundary } from '@sentry/react';
import { getPopupContainer } from '../../utils/ui';

// 用于快速选择
export const quickActionList = ['summary'];

/**
 *
 * 分层架构设计：AI Workspace -> AI Knowledge Base (Knowledge Collecton + AI Note + AI Copilot)
 * /knowledge-base 打开的是一体的，通过 query 参数显示 collection、note 或 copilot，都属于 knowledge base 里面的资源
 */
const KnowledgeLibraryLayout = () => {
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const userStore = useUserStore();
  const { t } = useTranslation();

  const [minSize] = useResizePanel({
    getGroupSelector: () => document.querySelector(`.workspace-panel-container`) as HTMLElement,
    getResizeSelector: () => document.querySelectorAll(`.workspace-panel-resize`),
    initialMinSize: 24,
    initialMinPixelSize: 310,
  });

  const copilotStyle = kbId
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
    <ErrorBoundary>
      <div className="workspace-container" style={{}}>
        <div className="workspace-inner-container">
          <PanelGroup direction="horizontal" className="workspace-panel-container">
            {kbId ? (
              <>
                <Panel
                  minSize={50}
                  order={1}
                  className="workspace-left-assist-panel"
                  key="workspace-left-assist-panel"
                  id="workspace-left-assist-panel"
                >
                  <KnowledgeBaseDetail getPopupContainer={() => getPopupContainer()} />
                </Panel>
                <PanelResizeHandle
                  className="workspace-panel-resize"
                  key="workspace-panel-resize"
                  id="workspace-panel-resize"
                />
              </>
            ) : null}
            <Panel
              order={3}
              className="workspace-content-panel"
              {...copilotStyle}
              minSize={minSize}
              key="workspace-content-panel"
              id="workspace-content-panel"
            >
              <AICopilot getPopupContainer={() => getPopupContainer()} />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default KnowledgeLibraryLayout;
