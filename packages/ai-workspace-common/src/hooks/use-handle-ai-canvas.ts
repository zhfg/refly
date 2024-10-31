import { useCallback } from 'react';

// hooks
import { useJumpNewPath } from './use-jump-new-path';

// types
import { CanvasIntentType } from '@refly/common-types';
import { ChatMessage } from '@refly/openapi-schema';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useParams } from 'react-router-dom';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

export interface IntentResult {
  type: CanvasIntentType;
  confidence: number;
  projectId?: string; // 对于画布相关操作可能需要
  canvasId?: string; // 对于更新/重写画布操作需要
  convId?: string; // 对于画布相关操作需要
  resourceId?: string; // 对于资源相关操作需要
  metadata?: Record<string, any>;
}

export const useHandleAICanvas = () => {
  const { jumpToConv } = useJumpNewPath();

  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get('convId');
  const { convId: pathConvId } = useParams();
  const convId = queryConvId || pathConvId;

  console.log('convId', convId);

  const handleGenerateCanvas = async (intent: IntentResult) => {
    const { messageIntentContext } = useChatStore.getState();
    jumpToConv({
      projectId: intent.projectId,
      convId: intent.convId,
      canvasId: intent.canvasId,
      state: {
        navigationContext: {
          shouldFetchDetail: false,
          source: messageIntentContext?.source,
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
            source: messageIntentContext?.source,
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
            source: messageIntentContext?.source,
          },
        },
      });
    }
  };

  const handleOther = useCallback(
    async (intent: IntentResult) => {
      const { messageIntentContext, messages = [] } = useChatStore.getState();

      if ([MessageIntentSource.Project].includes(messageIntentContext?.source) && intent.projectId) {
        jumpToConv({
          projectId: intent.projectId,
          convId: intent.convId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.source,
            },
          },
        });
      } else if (
        [MessageIntentSource.ConversationDetail, MessageIntentSource.HomePage].includes(messageIntentContext?.source)
      ) {
        jumpToConv({
          convId: intent.convId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.source,
            },
          },
        });
      } else if ([MessageIntentSource.Resource].includes(messageIntentContext?.source) && intent.resourceId) {
        jumpToConv({
          convId: intent.convId,
          resourceId: intent.resourceId,
          state: {
            navigationContext: {
              shouldFetchDetail: false,
              source: messageIntentContext?.source,
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
        case CanvasIntentType.GenerateCanvas:
          await handleGenerateCanvas(intent);
          break;
        case CanvasIntentType.EditCanvas:
          await handleEditCanvas(intent);
          break;
        case CanvasIntentType.RewriteCanvas:
          await handleRewriteCanvas(intent);
          break;
        case CanvasIntentType.Other:
          await handleOther(intent);
          break;
      }
    },
    [convId],
  );

  // 监听结构化数据中的意图识别结果
  const handleStructuredDataChange = useCallback(
    (message: ChatMessage) => {
      const intentMatcher = message?.structuredData?.intentMatcher as IntentResult;
      if (intentMatcher) {
        handleIntentBasedNavigation(intentMatcher);
      }
    },
    [convId],
  );

  return {
    handleStructuredDataChange,
  };
};
