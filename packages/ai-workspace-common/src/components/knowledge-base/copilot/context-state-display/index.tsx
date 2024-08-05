import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { NoteSelectedTextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/note-selected-text-panel';
import { ResourceDetailSelectedTextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-detail-selected-text-panel';
import { ResourceDetailContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/resource-detail-context-panel';
import { KnowledgeBaseContextPanel } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/knowledge-base-context-panel';

// styles
import './index.scss';
// context components

export const ContextStateDisplay = () => {
  const { contextDomain } = useCopilotContextState();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  return (
    <div className="ai-copilot-context-state-display-container">
      {contextDomain === 'selected-text' && knowledgeBaseStore.selectedNamespace === 'resource-detail' ? (
        <ResourceDetailSelectedTextPanel />
      ) : null}
      {contextDomain === 'selected-text' && knowledgeBaseStore.selectedNamespace === 'note' ? (
        <NoteSelectedTextPanel />
      ) : null}
      {contextDomain === 'resource' && <ResourceDetailContextPanel />}
      {contextDomain === 'note' && <ResourceDetailContextPanel />}
      {contextDomain === 'collection' && <KnowledgeBaseContextPanel />}
    </div>
  );
};
