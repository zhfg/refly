import { Divider, Button } from '@arco-design/web-react';
import { HiOutlinePlus } from 'react-icons/hi2';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useTranslation } from 'react-i18next';
import './index.scss';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';

export const AINoteEmpty = () => {
  const { t } = useTranslation();
  const { handleInitEmptyNote } = useAINote();

  const { newNoteCreating } = useNoteStore((state) => ({
    newNoteCreating: state.newNoteCreating,
  }));
  const { resourcePanelVisible } = useKnowledgeBaseStore((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
  }));

  return (
    <div className="flex items-center justify-center w-full mt-16 overflow-auto ai-note-empty">
      <div className="w-full h-full max-w-screen-lg">
        <Button
          className="ml-20 text-green-400"
          icon={<HiOutlinePlus />}
          loading={newNoteCreating}
          onClick={() => handleInitEmptyNote('')}
        >
          {t('knowledgeBase.note.newNote')}
        </Button>
        <Divider />
        <NoteList
          listGrid={
            resourcePanelVisible
              ? {
                  sm: 48,
                  md: 24,
                  lg: 16,
                  xl: 12,
                }
              : {
                  sm: 42,
                  md: 16,
                  lg: 10,
                  xl: 8,
                }
          }
        />
      </div>
    </div>
  );
};
