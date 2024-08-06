import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { NoteSelectedTextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/note-selected-text-card';
import { ResourceSelectedTextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-selected-text-card';
import { ResourceContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-context-card';
import { KnowledgeBaseContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/knowledge-base-context-card';
import { NoteContextCard } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/note-context-card';

// styles
import './index.scss';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
// context components

export const ContextStateDisplay = () => {
  const { contextDomain } = useCopilotContextState();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { nowSelectedContextDomain } = useContextPanelStore();

  const isSelectedTextCard = contextDomain === 'selected-text';

  return (
    <div className="ai-copilot-context-state-display-container">
      {isSelectedTextCard && knowledgeBaseStore.selectedNamespace === 'resource-detail' ? (
        <ResourceSelectedTextCard />
      ) : null}
      {isSelectedTextCard && knowledgeBaseStore.selectedNamespace === 'note' ? <NoteSelectedTextCard /> : null}
      {!isSelectedTextCard && nowSelectedContextDomain === 'resource' && <ResourceContextCard />}
      {!isSelectedTextCard && nowSelectedContextDomain === 'note' && <NoteContextCard />}
      {!isSelectedTextCard && nowSelectedContextDomain === 'collection' && <KnowledgeBaseContextCard />}
    </div>
  );
};
