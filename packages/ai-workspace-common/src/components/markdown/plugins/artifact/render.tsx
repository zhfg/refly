import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCode } from 'react-icons/fi';
import { IconLoading } from '@refly-packages/ai-workspace-common/components/common/icon';
import { MarkdownElementProps } from '../../types/index';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';
import { Artifact } from '@refly/openapi-schema';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

interface CanvasProps extends MarkdownElementProps {
  identifier: string;
  title: string;
  type: string;
  language: string;
}

const Render = memo<CanvasProps>((props: CanvasProps) => {
  const { title, id } = props;
  const { t } = useTranslation();
  const { canvasId } = useCanvasContext();

  // Use action result store to get status and artifact
  const [isGenerating, artifact] = useActionResultStoreShallow((s) => {
    const lookupId = id;
    const result = s.resultMap[lookupId];

    // Find the artifact in the steps
    const foundArtifact = result?.steps?.reduce<Artifact | null>((found, step) => {
      if (found) return found;
      return step.artifacts?.find((a) => a.type === 'code') ?? null;
    }, null);

    return [
      // Status is generating if result exists and is not finished
      result ? ['executing', 'waiting'].includes(result.status) : false,
      // Return found artifact
      foundArtifact,
    ];
  });

  const { addNodePreview } = useCanvasStoreShallow((state) => ({
    addNodePreview: state.addNodePreview,
  }));

  const handleClick = () => {
    if (artifact) {
      // Open the code artifact preview
      if (canvasId) {
        addNodePreview(canvasId, {
          id: artifact.entityId,
          type: 'code',
          data: {
            entityId: artifact.entityId,
            title: artifact.title,
          },
          position: { x: 0, y: 0 }, // Default position, will be adjusted by the canvas
        });
        locateToNodePreviewEmitter.emit('locateToNodePreview', { canvasId, id: artifact.entityId });
      }
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-solid border-gray-300 bg-white hover:shadow-sm hover:bg-gray-50 transition-all duration-200">
      <div className="flex cursor-pointer transition-colors" onClick={handleClick}>
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
                {artifact
                  ? t('artifact.openComponent', 'Click to view code component')
                  : t('artifact.codeArtifact', 'Code artifact')}
              </span>
              {isGenerating && <IconLoading className="w-2.5 h-2.5 text-blue-500 animate-spin" />}
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
