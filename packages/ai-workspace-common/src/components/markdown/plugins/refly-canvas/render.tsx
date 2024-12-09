import { memo, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Tooltip } from '@arco-design/web-react';

import { chatSelectors } from '@refly-packages/ai-workspace-common/stores/chat/selectors';

import { MarkdownElementProps } from '../../types/index';
import { useChatStore, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';

import { CANVAS_TAG_CLOSED_REGEX } from '@refly-packages/ai-workspace-common/constants/canvas';

import { getCanvasContent } from '@refly-packages/ai-workspace-common/components/copilot/utils';
import { IconCanvas } from '@refly-packages/ai-workspace-common/components/common/icon';

import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { DocumentIntentType } from '@refly/common-types';
import './render.scss';
import { safeParseJSON } from '@refly-packages/utils/parse';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useTranslation } from 'react-i18next';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface CanvasProps extends MarkdownElementProps {
  identifier: string;
  title: string;
  type: string;
}

const isReflyCanvasClosed = (content: string) => {
  return CANVAS_TAG_CLOSED_REGEX.test(content || '');
};

const Render = memo<CanvasProps>(({ identifier, title, type, children, id }) => {
  const hasChildren = !!children;
  const str = ((children as string) || '').toString?.();
  const { t } = useTranslation();

  const [isGenerating] = useMessageStateStore((state) => [state.pending]);
  const { jumpToProject } = useJumpNewPath();

  // canvasContent for render
  const [isCanvasTagClosed, intentMatcherResult] = useChatStore((s) => {
    const message = chatSelectors.getMessageById(id)(s);
    const intentMatcherResult =
      typeof message?.structuredData?.['intentMatcher'] === 'string'
        ? safeParseJSON(message?.structuredData?.['intentMatcher'])
        : message?.structuredData?.['intentMatcher'];

    return [isReflyCanvasClosed(message?.content), intentMatcherResult];
  });

  const openCanvas = () => {
    jumpToProject(
      {
        projectId: intentMatcherResult?.projectId,
      },
      {
        convId: intentMatcherResult?.convId,
        canvasId: intentMatcherResult?.canvasId,
      },
    );
  };

  const saveMetadata = () => {
    const { intentMatcher } = useChatStore.getState();

    if (intentMatcher?.type === DocumentIntentType.GenerateDocument) {
      editorEmitter.emit('updateCanvasTitle', title);
    }
  };

  useEffect(() => {
    // Emit event when title is available
    if (title) {
      saveMetadata();
    }
  }, [title]);

  // useEffect(() => {
  //   if (!hasChildren || !isGenerating) return;

  //   openCanvas();
  // }, [isGenerating, hasChildren, str, identifier, title, type, id]);

  return (
    <Tooltip content={t('copilot.message.openCanvas')} getPopupContainer={getPopupContainer}>
      <div className="refly-canvas-render-container">
        <div
          onClick={() => {
            // copilot as a assist role, so we need to open the canvas when click the canvas tag
            openCanvas();
          }}
        >
          <div className="refly-canvas-render-content">
            <IconCanvas style={{ fontSize: 18 }} />
            <div className="refly-canvas-render-content-right">
              {!title && isGenerating ? (
                <span>canvas is generating...</span>
              ) : (
                <span className="refly-canvas-render-title">{title || 'unknownTitle'}</span>
              )}
              {hasChildren && (
                <span className="refly-canvas-render-content-description">
                  {!isCanvasTagClosed && <Spin size="small" />}
                  <span>共 {str?.length} 字</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
});

export default Render;
