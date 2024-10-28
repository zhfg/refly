import { useCallback } from 'react';

// hooks
import { useJumpNewPath } from './use-jump-new-path';

// types
import { CanvasIntentType } from '@refly/common-types';
import { ChatMessage } from '@refly/openapi-schema';

export interface IntentResult {
  type: CanvasIntentType;
  confidence: number;
  projectId?: string; // 对于画布相关操作可能需要
  canvasId?: string; // 对于更新/重写画布操作需要
  convId?: string; // 对于画布相关操作需要
  metadata?: Record<string, any>;
}

export const useHandleAICanvas = () => {
  const { jumpToProject } = useJumpNewPath();

  const jumpToNewProject = async (intent: IntentResult) => {
    jumpToProject(
      {
        projectId: intent.projectId,
      },
      {
        convId: intent.convId,
        canvasId: intent.canvasId,
      },
    );
  };

  const updateExistingCanvas = async (intent: IntentResult) => {
    // TODO: 更新现有画布
  };

  const handleIntentBasedNavigation = async (intent: IntentResult) => {
    switch (intent.type) {
      case CanvasIntentType.GenerateCanvas:
        await jumpToNewProject(intent);
        break;
      case CanvasIntentType.EditCanvas:
      case CanvasIntentType.RewriteCanvas:
        if (intent.canvasId) {
          await updateExistingCanvas(intent);
        }
        break;
      case CanvasIntentType.Other:
        // 保持现有QA流程
        break;
    }
  };

  // 监听结构化数据中的意图识别结果
  const handleStructuredDataChange = useCallback((message: ChatMessage) => {
    const intentMatcher = message?.structuredData?.intentMatcher as IntentResult;
    if (intentMatcher) {
      handleIntentBasedNavigation(intentMatcher);
    }
  }, []);

  return {
    handleStructuredDataChange,
  };
};
