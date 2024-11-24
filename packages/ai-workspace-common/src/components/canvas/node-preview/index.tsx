import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasNode } from '../nodes/types';
import { SkillResponseNodePreview } from './skill-response';
import { ToolResponseNodePreview } from './tool-response';
import { ResourceNodePreview } from './resource';
import { SkillNodePreview } from './skill';
import { ToolNodePreview } from './tool';
import { DocumentNodePreview } from './document';
import { NodePreviewHeader } from './node-preview-header';
import { useState } from 'react';

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

  return (
    <div
      className={`
        fixed 
        ${isMaximized ? 'inset-4' : 'top-1/2 right-2 w-[420px] -translate-y-1/2'} 
        bg-white 
        rounded-lg 
        z-10
        transition-all 
        duration-200 
        ease-in-out
        border
        border-[rgba(16,24,40,0.0784)]
        shadow-[0px_4px_6px_0px_rgba(16,24,40,0.03)]
      `}
      style={{
        height: isMaximized ? undefined : 'calc(100vh - 16px)',
        maxHeight: 'calc(100vh - 16px)',
      }}
    >
      <NodePreviewHeader
        node={node}
        onClose={handleClosePanel}
        onPin={() => setIsPinned(!isPinned)}
        onMaximize={() => setIsMaximized(!isMaximized)}
        isPinned={isPinned}
        isMaximized={isMaximized}
      />

      <div className="h-[calc(100%-64px)] overflow-auto rounded-b-lg">{previewComponent(node?.type)}</div>
    </div>
  );
};
