import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// hooks
import { useJumpNewPath } from './use-jump-new-path';

// types
import { DocumentIntentType } from '@refly/common-types';
import { ChatMessage } from '@refly/openapi-schema';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useParams } from 'react-router-dom';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';

export interface IntentResult {
  type: DocumentIntentType;
  confidence: number;
  projectId?: string;
  canvasId?: string;
  convId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export const useHandleAICanvas = () => {
  const { jumpToConv } = useJumpNewPath();
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();
  const queryConvId = searchParams.get('convId');
  const { convId: pathConvId } = useParams();
  const convId = queryConvId || pathConvId;

  const handleGenerateCanvas = async (intent: IntentResult) => {
    const { messageIntentContext } = useChatStore.getState();
    jumpToConv({
      projectId: intent.projectId,
      convId: intent.convId,
      canvasId: intent.canvasId,
      fullScreen: location.pathname === '/',
      state: {
        navigationContext: {
          shouldFetchDetail: false,
          source: messageIntentContext?.env?.source,
        },
      },
    });
  };

  const handleEditCanvas = async (intent: IntentResult) => {
    const { messageIntentContext } = useChatStore.getState();
    if (intent.canvasId) {
      jumpToConv({
        projectId: intent.projectId,
        convId: intent.convId,
        canvasId: intent.canvasId,
        state: {
          navigationContext: {
            shouldFetchDetail: false,
            source: messageIntentContext?.env?.source,
          },
        },
      });
    }
  };

  const handleRewriteCanvas = async (intent: IntentResult) => {
    const { messageIntentContext } = useChatStore.getState();
    if (intent.canvasId) {
      jumpToConv({
        projectId: intent.projectId,
        convId: intent.convId,
        canvasId: intent.canvasId,
        state: {
          navigationContext: {
            shouldFetchDetail: false,
            source: messageIntentContext?.env?.source,
          },
        },
      });
    }
  };

  const handleOther = useCallback(
    async (intent: IntentResult) => {
      const { messageIntentContext, messages = [] } = useChatStore.getState();

      if ([MessageIntentSource.Project].includes(messageIntentContext?.env?.source) && intent.projectId) {
        jumpToConv({
          projectId: intent.projectId,
          convId: intent.convId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.env?.source,
            },
          },
        });
      } else if (
        [MessageIntentSource.ConversationDetail, MessageIntentSource.HomePage].includes(
          messageIntentContext?.env?.source,
        )
      ) {
        jumpToConv({
          convId: intent.convId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.env?.source,
            },
          },
        });
      } else if ([MessageIntentSource.Resource].includes(messageIntentContext?.env?.source) && intent.resourceId) {
        jumpToConv({
          convId: intent.convId,
          resourceId: intent.resourceId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.env?.source,
            },
          },
        });
      }
    },
    [convId],
  );

  const handleIntentBasedNavigation = useCallback(
    async (intent: IntentResult) => {
      switch (intent.type) {
        case DocumentIntentType.GenerateDocument:
          await handleGenerateCanvas(intent);
          break;
        case DocumentIntentType.EditDocument:
          await handleEditCanvas(intent);
          break;
        case DocumentIntentType.RewriteDocument:
          await handleRewriteCanvas(intent);
          break;
        case DocumentIntentType.Other:
          await handleOther(intent);
          break;
      }
    },
    [convId],
  );

  // Monitor the intent recognition result in the structured data
  const handleStructuredDataChange = useCallback(
    (message: ChatMessage) => {
      const intentMatcher = message?.structuredData?.intentMatcher as IntentResult;
      if (intentMatcher) {
        handleIntentBasedNavigation(intentMatcher);
      }
    },
    [convId],
  );

  useEffect(() => {
    const handleExitFullScreen = () => {
      console.log('exitFullScreen', searchParams.toString());
      if (searchParams.has('fullScreen')) {
        searchParams.delete('fullScreen');
        setSearchParams(searchParams);
      }
    };

    editorEmitter.on('exitFullScreen', handleExitFullScreen);
    return () => {
      editorEmitter.off('exitFullScreen', handleExitFullScreen);
    };
  }, [searchParams, setSearchParams]);

  const handleAICanvasBeforeStreamHook = useCallback(() => {
    const { messageIntentContext } = useChatStore.getState();
    const { inPlaceActionType, canvasEditConfig } = messageIntentContext || {};

    if (inPlaceActionType || canvasEditConfig) {
      editorEmitter.emit('askAIResponse', {
        inPlaceActionType,
        canvasEditConfig,
      });
    }
  }, [convId]);

  return {
    handleStructuredDataChange,
    handleAICanvasBeforeStreamHook,
  };
};
