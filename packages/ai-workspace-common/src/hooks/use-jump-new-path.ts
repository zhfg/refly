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
    projectId,
    baseUrl = '',
    openNewTab = false,
  }: {
    canvasId: string;
    projectId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    searchParams.set('canvasId', canvasId);
    setSearchParams(searchParams);
    const url = `${baseUrl}/project/${projectId}?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      if (!canvasStore.notePanelVisible) {
        canvasStore.updateNotePanelVisible(true);
      }
    }
  };

  const jumpToProject = (
    {
      projectId,
      baseUrl = '',
      openNewTab = false,
    }: {
      projectId: string;
      baseUrl?: string;
      openNewTab?: boolean;
    },
    extraQuery?: Record<string, string>,
  ) => {
    if (extraQuery) {
      Object.entries(extraQuery).forEach(([key, value]) => {
        if (!['canvasId', 'resId', 'convId'].includes(key)) {
          return;
        }

        searchParams.set(key, value);
      });
    }

    setSearchParams(searchParams);

    const url = `${baseUrl}/project/${projectId}?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const jumpToProjectResource = ({
    projectId,
    resId = '',
    baseUrl = '',
    openNewTab = false,
  }: {
    projectId: string;
    resId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    searchParams.set('resId', resId);
    setSearchParams(searchParams);
    const url = `${baseUrl}/project/${projectId}?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const jumpToSoloResource = ({
    resId,
    baseUrl = '',
    openNewTab = false,
  }: {
    resId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    const url = `${baseUrl}/knowledge-base/resource/${resId}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      // if (!knowledgeBaseStore.resourcePanelVisible) {
      //   knowledgeBaseStore.updateResourcePanelVisible(true);
      // }
    }
  };

  const jumpToResource = ({
    resId,
    projectId,
    baseUrl = '',
    openNewTab = false,
  }: {
    resId: string;
    projectId?: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    if (projectId) {
      jumpToProjectResource({ projectId, resId, baseUrl, openNewTab });
    } else {
      jumpToSoloResource({ resId, baseUrl, openNewTab });
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

  const jumpToConv = ({
    convId,
    projectId,
    baseUrl = '',
    openNewTab = false,
  }: {
    convId: string;
    projectId?: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    if (projectId) {
      jumpToProjectConv({ projectId, convId, baseUrl, openNewTab });
    } else {
      jumpToSoloConv({ convId, baseUrl, openNewTab });
    }
  };

  const jumpToProjectConv = ({
    projectId,
    convId,
    baseUrl = '',
    openNewTab = false,
  }: {
    projectId: string;
    convId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    searchParams.set('convId', convId);
    setSearchParams(searchParams);
    const url = `${baseUrl}/project/${projectId}?${searchParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const jumpToSoloConv = ({
    convId,
    baseUrl = '',
    openNewTab = false,
  }: {
    convId: string;
    baseUrl?: string;
    openNewTab?: boolean;
  }) => {
    const url = `${baseUrl}/thread/${convId}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return {
    jumpToCanvas,
    jumpToProject,
    jumpToResource,
    jumpToConv,
    removeKbAndResId,
    removeNoteId,
  };
};
