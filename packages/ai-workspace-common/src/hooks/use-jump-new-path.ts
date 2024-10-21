import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

export const useKnowledgeBaseJumpNewPath = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const canvasStore = useCanvasStoreShallow((state) => ({
    notePanelVisible: state.canvasPanelVisible,
    updateCurrentNote: state.updateCurrentCanvas,
    updateNotePanelVisible: state.updateCanvasPanelVisible,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    resourcePanelVisible: state.resourcePanelVisible,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
  }));
  const navigate = useNavigate();

  const jumpToCanvas = ({
    canvasId,
    baseUrl = '',
    openNewTab = false,
  }: {
    canvasId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    searchParams.set('noteId', canvasId);
    setSearchParams(searchParams);
    const url = `${baseUrl}/knowledge-base?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      if (!canvasStore.notePanelVisible) {
        canvasStore.updateNotePanelVisible(true);
      }
    }
  };

  const jumpToKnowledgeBase = (
    {
      kbId,
      baseUrl = '',
      openNewTab = false,
    }: {
      kbId: string;
      baseUrl?: string;
      openNewTab?: boolean;
    },
    extraQuery?: Record<string, string>,
  ) => {
    searchParams.set('kbId', kbId);
    if (extraQuery) {
      Object.entries(extraQuery).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }
    setSearchParams(searchParams);
    const url = `${baseUrl}/knowledge-base?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      if (!knowledgeBaseStore.resourcePanelVisible) {
        knowledgeBaseStore.updateResourcePanelVisible(true);
      }
    }
  };

  const jumpToReadResource = ({
    resId,
    baseUrl = '',
    openNewTab = false,
  }: {
    resId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    searchParams.set('resId', resId);
    setSearchParams(searchParams);
    const url = `${baseUrl}/knowledge-base?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      if (!knowledgeBaseStore.resourcePanelVisible) {
        knowledgeBaseStore.updateResourcePanelVisible(true);
      }
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
    jumpToCanvas,
    jumpToKnowledgeBase,
    jumpToReadResource,
    jumpToConv,
    removeKbAndResId,
    removeNoteId,
  };
};
