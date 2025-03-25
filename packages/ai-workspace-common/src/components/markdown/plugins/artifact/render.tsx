import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCode } from 'react-icons/fi';
import { IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { MarkdownElementProps } from '../../types/index';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';
import {
  CanvasNode,
  CodeArtifactNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes/shared/types';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { MarkdownMode } from '../../types';
import { useReactFlow } from '@xyflow/react';
import { useNodePreviewControl } from '@refly-packages/ai-workspace-common/hooks/canvas';

interface CanvasProps extends MarkdownElementProps {
  identifier: string;
  title: string;
  type: string;
  language: string;
  mode?: MarkdownMode;
}

const Render = memo<CanvasProps>((props: CanvasProps) => {
  const { title, id, mode = 'interactive' } = props;
  const { t } = useTranslation();
  const { getNodes, getEdges } = useReactFlow();

  const isInteractive = mode === 'interactive';

  // Only use canvas context if in interactive mode
  const canvasContext = isInteractive ? useCanvasContext() : { canvasId: undefined };
  const canvasId = canvasContext?.canvasId;

  // Access flow data to get the artifact node
  const [isGenerating, artifactNode] = useMemo<
    [boolean, CanvasNode<CodeArtifactNodeMeta> | null]
  >(() => {
    const nodes = getNodes() as CanvasNode[];
    const thisNode = nodes.find((node) => node.data?.entityId === id);

    if (!thisNode) return null;

    // Find the descendant nodes that are code artifacts and pick the latest one
    const edges = getEdges();
    const descendantNodeIds = edges
      .filter((edge) => edge.source === thisNode.id)
      .map((edge) => edge.target);
    const descendantNodes = nodes
      .filter((node) => descendantNodeIds.includes(node.id))
      .filter((node) => node.type === 'codeArtifact')
      .sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
    const artifactNode: CanvasNode<CodeArtifactNodeMeta> | null = descendantNodes[0];

    return [
      ['executing', 'waiting'].includes(artifactNode?.data?.metadata?.status ?? ''),
      artifactNode,
    ];
  }, [getNodes, getEdges, id]);

  // Only use canvas store if in interactive mode and not readonly
  const { previewNode } = useNodePreviewControl({ canvasId });
  const addNodePreview = isInteractive ? previewNode : undefined;

  const handleClick = useCallback(() => {
    if (!artifactNode || !canvasId || !isInteractive || !addNodePreview) return;

    let nodeIdForEvent: string | undefined; // Track the node ID to use in the locate event

    if (artifactNode) {
      // Use the existing node's information for the preview
      nodeIdForEvent = artifactNode.id;
      addNodePreview(artifactNode as unknown as CanvasNode);
    }

    if (nodeIdForEvent) {
      // Emit the locate event with the correct node ID
      locateToNodePreviewEmitter.emit('locateToNodePreview', { canvasId, id: nodeIdForEvent });
    }
  }, [artifactNode, canvasId, isInteractive, addNodePreview]);

  // Determine the cursor style based on mode
  const cursorStyle = isInteractive ? 'cursor-pointer' : 'cursor-default';

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-solid border-gray-300 bg-white hover:shadow-sm hover:bg-gray-50 transition-all duration-200">
      <div className={`flex ${cursorStyle} transition-colors`} onClick={handleClick}>
        {/* Left section with gray background */}
        <div className="flex items-center justify-center bg-gray-50 p-3">
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <FiCode className="text-gray-500 text-sm" />
          </div>
        </div>

        {/* Right section with content */}
        <div className="flex-1 flex items-center p-3">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {!title && isGenerating
                  ? t('artifact.generating', 'Code artifact is generating...')
                  : title || 'Code Artifact'}
              </span>
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <span className="mr-2">
                {artifactNode && isInteractive
                  ? t('artifact.openComponent', 'Click to view code component')
                  : t('artifact.codeArtifact', 'Code artifact')}
              </span>
              {isGenerating && <IconLoading className="w-2.5 h-2.5 text-gray-500 animate-spin" />}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 text-gray-400 ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Render;
