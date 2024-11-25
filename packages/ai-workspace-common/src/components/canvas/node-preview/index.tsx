import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasNode } from '../nodes/types';
import { SkillResponseNodePreview } from './skill-response';
import { ToolResponseNodePreview } from './tool-response';
import { ResourceNodePreview } from './resource';
import { SkillNodePreview } from './skill';
import { ToolNodePreview } from './tool';
import { DocumentNodePreview } from './document';
import { NodePreviewHeader } from './node-preview-header';
import { useState, useMemo } from 'react';

export const NodePreview = ({ node, handleClosePanel }: { node: CanvasNode<any>; handleClosePanel: () => void }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const previewComponent = (nodeType: CanvasNodeType) => {
    switch (nodeType) {
      case 'resource':
        return <ResourceNodePreview resourceId={node.data.entityId} />;
      case 'document':
        return (
          <DocumentNodePreview
            nodeData={{
              entityId: node.data?.entityId,
              entityType: 'document',
            }}
          />
        );
      case 'skill':
        return <SkillNodePreview />;
      case 'tool':
        return <ToolNodePreview />;
      case 'skillResponse':
        return <SkillResponseNodePreview resultId={node.data.entityId} />;
      case 'toolResponse':
        return <ToolResponseNodePreview resultId={node.data.entityId} />;
      default:
        return null;
    }
  };

  const previewStyles = useMemo(
    () => ({
      height: isMaximized ? 'calc(100vh - 72px)' : 'calc(100vh - 72px)',
      maxHeight: 'calc(100vh - 72px)',
      width: isMaximized ? 'calc(100% - 32px)' : '420px',
      transform: isMaximized ? 'translate3d(-50%, 64px, 0)' : 'translate3d(0, 64px, 0)',
      '--tw-transform': 'none !important',
    }),
    [isMaximized],
  );

  const previewClassName = useMemo(
    () => `
    absolute
    ${isMaximized ? 'left-1/2' : 'right-2'}
    top-0
    bg-white 
    rounded-lg 
    z-10
    transition-all 
    duration-200 
    ease-in-out
    border
    border-[rgba(16,24,40,0.0784)]
    shadow-[0px_4px_6px_0px_rgba(16,24,40,0.03)]
    will-change-transform
  `,
    [isMaximized],
  );

  const preview = useMemo(() => previewComponent(node?.type), [node?.type]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className={previewClassName} style={previewStyles}>
        <div className="pointer-events-auto">
          <NodePreviewHeader
            node={node}
            onClose={handleClosePanel}
            onPin={() => setIsPinned(!isPinned)}
            onMaximize={() => setIsMaximized(!isMaximized)}
            isPinned={isPinned}
            isMaximized={isMaximized}
          />
        </div>
        <div className="h-[calc(100%-64px)] overflow-auto rounded-b-lg pointer-events-auto">{preview}</div>
      </div>
    </div>
  );
};
