import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { NoteSelectedContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/note-selected-context-panel';
import { ResourceDetailSelectedContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-detail-selected-context-panel';
import { ResourceDetailContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-detail-context-panel';
import { KnowledgeBaseContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/knowledge-base-context-panel';

// context components

export const ContextStateDisplay = () => {
  const { showKnowledgeBaseContext, showResourceContext, showSelectedTextContext } = useCopilotContextState();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  return (
    <div className="ai-copilot-context-state-display-container">
      {showSelectedTextContext && knowledgeBaseStore.selectedNamespace === 'resource-detail' ? (
        <ResourceDetailSelectedContextPanel />
      ) : null}
      {showSelectedTextContext && knowledgeBaseStore.selectedNamespace === 'note' ? <NoteSelectedContextPanel /> : null}
      {showResourceContext ? <ResourceDetailContextPanel /> : null}
      {showKnowledgeBaseContext ? <KnowledgeBaseContextPanel /> : null}
    </div>
  );
};
