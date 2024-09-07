import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { ResourceSelectedTextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/selected-text-card/resource-selected-text-card';
import { ResourceContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/context-card/resource-context-card';
import { KnowledgeBaseContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/context-card/knowledge-base-context-card';
import { NoteContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/context-card/note-context-card';
import { WeblinkContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/context-card/weblink-context-card.extension';

// styles
import './index.scss';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
// context components

export const ContextStateDisplay = () => {
  const { contextDomain, computedShowContextCard } = useCopilotContextState();
  const contextPanelStore = useContextPanelStore((state) => ({
    nowSelectedContextDomain: state.nowSelectedContextDomain,
    selectedTextCardDomain: state.selectedTextCardDomain,
  }));
  const runtime = getRuntime();

  const { nowSelectedContextDomain } = contextPanelStore;

  const isSelectedTextCard = contextDomain === 'selected-text';
  const isExtension = runtime !== 'web';
  const renderCompList = [];

  console.log('isSelectedTextCard', isSelectedTextCard, isExtension, computedShowContextCard);

  if (isExtension && !isSelectedTextCard) {
    renderCompList.push(<WeblinkContextCard key="weblink-context-card" />);
  } else {
    if (isSelectedTextCard) {
      // use one component to render all selected text card
      renderCompList.push(<ResourceSelectedTextCard key="resource-selected-text-card" />);
    } else {
      if (nowSelectedContextDomain === 'resource') {
        renderCompList.push(<ResourceContextCard key="resource-context-card" />);
      } else if (nowSelectedContextDomain === 'note') {
        renderCompList.push(<NoteContextCard key="note-context-card" />);
      } else if (nowSelectedContextDomain === 'collection') {
        renderCompList.push(<KnowledgeBaseContextCard key="collection-context-card" />);
      }
    }
  }

  return <div className="ai-copilot-context-state-display-container">{renderCompList}</div>;
};
