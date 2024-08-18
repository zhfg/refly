import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { KnowledgeBaseDetail } from '@refly-packages/ai-workspace-common/components/knowledge-base/knowledge-base-detail';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot';
// utils
// 自定义方法
// stores
// scss
import './index.scss';
// types
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useResizePanel } from '@refly-packages/ai-workspace-common/hooks/use-resize-panel';
import { ErrorBoundary } from '@sentry/react';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';

// 用于快速选择
export const quickActionList = ['summary'];

/**
 *
 * 分层架构设计：AI Workspace -> AI Knowledge Base (Knowledge Collecton + AI Note + AI Copilot)
 * /knowledge-base 打开的是一体的，通过 query 参数显示 collection、note 或 copilot，都属于 knowledge base 里面的资源
 */
const KnowledgeLibraryLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const userStore = useUserStore();
  const { t } = useTranslation();
  const knowledgeBaseStore = useKnowledgeBaseStore();

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

  console.log('current resource', knowledgeBaseStore.currentResource);

  return (
    <ErrorBoundary>
      <div className="workspace-container" style={{}}>
        <div className="workspace-inner-container">
          <div className="workspace-panel-container">
            <div className="workspace-content-panel">
              <AICopilot />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default KnowledgeLibraryLayout;
