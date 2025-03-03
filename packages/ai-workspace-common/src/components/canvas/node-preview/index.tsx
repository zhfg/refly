import { CanvasNode } from '../nodes/shared/types';
import { SkillResponseNodePreview } from './skill-response';
import { ResourceNodePreview } from './resource';
import { SkillNodePreview } from './skill';
import { ToolNodePreview } from './tool';
import { DocumentNodePreview } from './document';
import { NodePreviewHeader } from './node-preview-header';
import { useState, useMemo, useCallback, useRef, memo } from 'react';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { CodeArtifactNodePreview } from './code-artifact';

const PreviewComponent = memo(
  ({ node }: { node: CanvasNode<any> }) => {
    if (!node?.type) return null;

    switch (node.type) {
      case 'resource':
        return <ResourceNodePreview node={node} resourceId={node.data.entityId} />;
      case 'document':
        return (
          <DocumentNodePreview
            nodeData={{
              entityId: node.data?.entityId,
              entityType: 'document',
              node: node,
            }}
          />
        );
      case 'skill':
        return <SkillNodePreview />;
      case 'tool':
        return <ToolNodePreview />;
      case 'skillResponse':
        return <SkillResponseNodePreview node={node} resultId={node.data.entityId} />;
      case 'code':
        return <CodeArtifactNodePreview node={node} artifactId={node.data.entityId} />;
      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    // Check type and entity ID
    const basicPropsEqual =
      prevProps.node?.type === nextProps.node?.type &&
      prevProps.node?.data?.entityId === nextProps.node?.data?.entityId;

    if (!basicPropsEqual) return false;

    // Check content preview
    const contentEqual =
      prevProps.node?.data?.contentPreview === nextProps.node?.data?.contentPreview;

    // Check title
    const titleEqual = prevProps.node?.data?.title === nextProps.node?.data?.title;

    // Check metadata status (for generating state)
    const statusEqual =
      prevProps.node?.data?.metadata?.status === nextProps.node?.data?.metadata?.status;

    return basicPropsEqual && contentEqual && titleEqual && statusEqual;
  },
);

export const NodePreview = memo(
  ({ node, canvasId }: { node: CanvasNode<any>; canvasId: string }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const { removePinnedNode } = useCanvasStoreShallow((state) => ({
      removePinnedNode: state.removeNodePreview,
    }));

    const handleClose = useCallback(() => {
      removePinnedNode(canvasId, node.id);
    }, [node, removePinnedNode, canvasId]);

    const previewStyles = useMemo(
      () => ({
        height: isMaximized ? '100vh' : 'calc(100vh - 72px)',
        width: isMaximized ? 'calc(100vw)' : '420px',
        top: isMaximized ? 0 : null,
        right: isMaximized ? 0 : null,
        zIndex: isMaximized ? 50 : 10,
        transition: isMaximized
          ? 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'all 50ms cubic-bezier(0.4, 0, 0.2, 1)',
      }),
      [isMaximized],
    );

    const previewClassName = useMemo(
      () => `
    bg-white 
    rounded-lg 
    will-change-transform
    ${isMaximized ? 'fixed' : ''}
  `,
      [isMaximized],
    );

    const handleMaximize = useCallback(() => {
      setIsMaximized(!isMaximized);
    }, [isMaximized]);

    return (
      <div
        data-preview-id={node?.id}
        className="pointer-events-none border border-solid border-gray-100 rounded-lg shadow-lg bg-transparent"
        ref={previewRef}
      >
        <div className={previewClassName} style={previewStyles}>
          <div className="pointer-events-auto">
            <NodePreviewHeader
              node={node}
              onClose={handleClose}
              onMaximize={handleMaximize}
              isMaximized={isMaximized}
            />
          </div>
          <div className="h-[calc(100%-52px)] overflow-auto rounded-b-lg pointer-events-auto preview-container">
            <PreviewComponent node={node} />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    const basicPropsEqual =
      prevProps.node?.id === nextProps.node?.id && prevProps.canvasId === nextProps.canvasId;

    if (!basicPropsEqual) return false;

    const contentEqual =
      prevProps.node?.data?.contentPreview === nextProps.node?.data?.contentPreview;

    const titleEqual = prevProps.node?.data?.title === nextProps.node?.data?.title;

    const statusEqual =
      prevProps.node?.data?.metadata?.status === nextProps.node?.data?.metadata?.status;

    return basicPropsEqual && contentEqual && titleEqual && statusEqual;
  },
);
