import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useNoteStoreShallow } from '@refly-packages/ai-workspace-common/stores/note';
import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

export const useKnowledgeBaseJumpNewPath = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteStore = useNoteStoreShallow((state) => ({
    notePanelVisible: state.notePanelVisible,
    updateCurrentNote: state.updateCurrentNote,
    updateNotePanelVisible: state.updateNotePanelVisible,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
  }));
  const navigate = useNavigate();

  const jumpToNote = ({ noteId, baseUrl = '' }: { noteId: string; baseUrl?: string }) => {
    searchParams.set('noteId', noteId);
    setSearchParams(searchParams);
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
    if (!noteStore.notePanelVisible) {
      noteStore.updateNotePanelVisible(true);
    }
  };

  const jumpToKnowledgeBase = (
    { kbId, baseUrl = '' }: { kbId: string; baseUrl?: string },
    extraQuery?: Record<string, string>,
  ) => {
    searchParams.set('kbId', kbId);
    setSearchParams(searchParams.toString());
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
    if (!knowledgeBaseStore.resourcePanelVisible) {
      knowledgeBaseStore.updateResourcePanelVisible(true);
    }
  };

  const jumpToReadResource = ({ resId, baseUrl = '' }: { resId: string; baseUrl?: string }) => {
    searchParams.set('resId', resId);
    setSearchParams(searchParams);
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
    if (!knowledgeBaseStore.resourcePanelVisible) {
      knowledgeBaseStore.updateResourcePanelVisible(true);
    }
  };

  const removeKbAndResId = ({ baseUrl = '' }: { baseUrl?: string }) => {
    searchParams.delete('kbId');
    searchParams.delete('resId');
    setSearchParams(searchParams);
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
  };

  const removeNoteId = ({ baseUrl = '' }: { baseUrl?: string }) => {
    searchParams.delete('noteId');
    setSearchParams(searchParams);
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
  };

  const jumpToConv = ({ convId, baseUrl = '' }: { convId: string; baseUrl?: string }) => {
    searchParams.set('convId', convId);
    setSearchParams(searchParams);
    navigate(`${baseUrl}/knowledge-base?${searchParams.toString()}`);
  };

  return {
    jumpToNote,
    jumpToKnowledgeBase,
    jumpToReadResource,
    jumpToConv,
    removeKbAndResId,
    removeNoteId,
  };
};
