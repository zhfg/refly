import { memo, useEffect, useState } from 'react';
import { Spin } from 'antd';

import { chatSelectors } from '@refly-packages/ai-workspace-common/stores/chat/selectors';

import { MarkdownElementProps } from '../../types/index';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';

import { CANVAS_TAG, CANVAS_TAG_CLOSED_REGEX } from '@refly-packages/ai-workspace-common/constants/canvas';

import { Drawer } from 'antd';
import { getCanvasContent } from '@refly-packages/ai-workspace-common/components/copilot/utils';
import { IconCanvas } from '@refly-packages/ai-workspace-common/components/common/icon';

import './render.scss';

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

  const [open, setOpen] = useState(false);

  const [isGenerating] = useMessageStateStore((state) => [state.pending]);
  const [isCanvasTagClosed, canvasContent] = useChatStore((s) => {
    const message = chatSelectors.getMessageById(id)(s);
    const canvasContent = getCanvasContent(message?.content as string);

    return [isReflyCanvasClosed(message?.content), canvasContent];
  });

  const openCanvas = () => {
    // 这里直接打开 canvas
    // openArtifact({ id, identifier, title, type });
    setOpen(true);
  };

  useEffect(() => {
    if (!hasChildren || !isGenerating) return;

    openCanvas();
  }, [isGenerating, hasChildren, str, identifier, title, type, id]);

  return (
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
      <Drawer title="Basic Drawer" onClose={() => setOpen(false)} open={open}>
        <p>{canvasContent}</p>
      </Drawer>
    </div>
  );
});

export default Render;
