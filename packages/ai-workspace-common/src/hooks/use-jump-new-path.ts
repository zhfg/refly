import { useNavigationContextStoreShallow } from '@refly-packages/ai-workspace-common/stores/navigation-context';
import { NavigationContext } from '@refly-packages/ai-workspace-common/types/copilot';
import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useConversationStoreShallow } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useEffect, useRef } from 'react';

export const useJumpNewPath = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  const navigate = useNavigate();
  const { setNavigationContext } = useNavigationContextStoreShallow((state) => ({
    setNavigationContext: state.setNavigationContext,
  }));

  const conversationStore = useConversationStoreShallow((state) => ({
    resetState: state.resetState,
  }));

  // Helper function to get fresh searchParams
  const getCleanSearchParams = () => {
    const currentParams = searchParamsRef.current;
    return currentParams;
  };

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
    const currentParams = getCleanSearchParams();
    for (const key of Array.from(currentParams.keys())) {
      if (['resId', 'canvasId'].includes(key)) {
        currentParams.delete(key);
      }
    }
    currentParams.set('canvasId', canvasId);
    setSearchParams(currentParams);
    const url = `${baseUrl}/project/${projectId}?${currentParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const jumpToProject = (
    {
      projectId,
      baseUrl = '',
      openNewTab = false,
      onlySetParams = false,
    }: {
      projectId: string;
      baseUrl?: string;
      openNewTab?: boolean;
      onlySetParams?: boolean;
    },
    extraQuery?: Record<string, string>,
  ) => {
    const currentParams = getCleanSearchParams();
    for (const key of Array.from(currentParams.keys())) {
      if (['resId', 'canvasId'].includes(key)) {
        currentParams.delete(key);
      }
    }

    if (extraQuery) {
      Object.entries(extraQuery).forEach(([key, value]) => {
        if (!['canvasId', 'resId', 'convId'].includes(key)) {
          return;
        }
        currentParams.set(key, value);
      });
    }

    setSearchParams(currentParams);

    if (onlySetParams) {
      return;
    }

    const url = `${baseUrl}/project/${projectId}?${currentParams.toString()}`;

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
    const currentParams = getCleanSearchParams();
    currentParams.set('resId', resId);
    currentParams.delete('canvasId'); // either resId or canvasId can be displayed
    setSearchParams(currentParams);
    const url = `${baseUrl}/project/${projectId}?${currentParams.toString()}`;

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
    const currentParams = getCleanSearchParams();
    const url = `${baseUrl}/resource/${resId}?${currentParams.toString()}`;

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
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

  const jumpToConv = ({
    convId,
    projectId,
    canvasId,
    resourceId,
    baseUrl = '',
    openNewTab = false,
    fullScreen = false,
    state,
  }: {
    convId: string;
    projectId?: string;
    canvasId?: string;
    resourceId?: string;
    baseUrl?: string;
    openNewTab?: boolean;
    fullScreen?: boolean;
    state: { navigationContext?: NavigationContext };
  }) => {
    const currentParams = getCleanSearchParams();

    if (state.navigationContext?.clearSearchParams) {
      for (const key of Array.from(currentParams.keys())) {
        currentParams.delete(key);
      }
    }

    let url: string;

    if (projectId) {
      convId ? currentParams.set('convId', convId) : currentParams.delete('convId');
      if (canvasId) {
        currentParams.set('canvasId', canvasId);
      }
      if (fullScreen) {
        currentParams.set('fullScreen', '1');
      }
      setSearchParams(currentParams);
      url = `${baseUrl}/project/${projectId}?${currentParams.toString()}`;
    } else if (resourceId) {
      convId ? currentParams.set('convId', convId) : currentParams.delete('convId');
      setSearchParams(currentParams);
      url = `${baseUrl}/resource/${resourceId}?${currentParams.toString()}`;
    } else {
      url = `${baseUrl}/thread/${convId}`;
    }

    if (!convId) {
      conversationStore.resetState();
    }

    if (openNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
      setNavigationContext(state.navigationContext);
    }
  };

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  return {
    jumpToCanvas,
    jumpToProject,
    jumpToResource,
    jumpToConv,
  };
};
