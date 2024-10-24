import { memo, useEffect, useState } from 'react';
import { Spin } from 'antd';

import { chatSelectors } from '@refly-packages/ai-workspace-common/stores/chat/selectors';

import { MarkdownElementProps } from '../../types/index';
import { IconApps } from '@arco-design/web-react/icon';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';

import { CANVAS_TAG, CANVAS_TAG_CLOSED_REGEX } from '@refly-packages/ai-workspace-common/constants/canvas';

import { Drawer } from 'antd';
import { getCanvasContent } from '@refly-packages/ai-workspace-common/components/copilot/utils';

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
    <p style={{ border: '1px solid gray', borderRadius: 4 }}>
      <div
        onClick={() => {
          // copilot as a assist role, so we need to open the canvas when click the canvas tag
          openCanvas();
        }}
      >
        <div>
          <div>
            <IconApps />
          </div>
          <div>
            {!title && isGenerating ? <span>canvas is generating...</span> : <span>{title || 'unknownTitle'}</span>}
            {hasChildren && (
              <span>
                {identifier} ·{' '}
                <span>
                  {!isCanvasTagClosed && (
                    <div>
                      <Spin />
                    </div>
                  )}
                  已生成 {str?.length} 字
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      <Drawer title="Basic Drawer" onClose={() => setOpen(false)} open={open}>
        <p>{canvasContent}</p>
      </Drawer>
    </p>
  );
});

export default Render;
