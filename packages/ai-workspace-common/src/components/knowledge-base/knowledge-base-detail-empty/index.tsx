import { Divider, Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { useImportKnowledgeModal } from '@refly-packages/ai-workspace-common/stores/import-knowledge-modal';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';
import './index.scss';

export const KnowledgeBaseDetailEmpty = () => {
  const importKnowledgeModal = useImportKnowledgeModal();
  const noteStore = useCanvasStore((state) => ({
    notePanelVisible: state.canvasPanelVisible,
  }));

  const handleCreateKnowledgeBase = () => {
    importKnowledgeModal.setShowNewKnowledgeModal(true);
    importKnowledgeModal.setEditCollection(null);
  };

  return (
    <div className="ai-note-empty w-full mt-16 flex justify-center items-center overflow-auto">
      <div className="w-full h-full max-w-screen-lg">
        <Button className="text-green-400 ml-8" icon={<IconPlus />} onClick={() => handleCreateKnowledgeBase()}>
          创建知识库
        </Button>
        <Divider />
        <KnowledgeBaseList
          listGrid={
            noteStore.notePanelVisible
              ? {
                  sm: 48,
                  md: 24,
                  lg: 16,
                  xl: 12,
                }
              : null
          }
        />
      </div>
    </div>
  );
};
