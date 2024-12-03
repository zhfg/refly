import { ActionStep, Artifact } from '@refly/openapi-schema';
import { CanvasNodeData } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';
import { IconCanvas, IconDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { ResponseNodeMeta } from '@refly-packages/ai-workspace-common/components/canvas/nodes/types';

export const getArtifactIcon = (artifact: Artifact, className?: string) => {
  switch (artifact.type) {
    case 'document':
      return <IconDocument className={cn('w-4 h-4', className)} />;
    default:
      return <IconCanvas className={cn('w-4 h-4', className)} />;
  }
};

export const getResultDisplayContent = (data: CanvasNodeData<ResponseNodeMeta>, className?: string) => {
  const steps: ActionStep[] = data.metadata?.steps ?? [];
  const content = steps
    ?.map((step) => step.content)
    ?.filter(Boolean)
    .join('\n');
  if (content) return <span className={className}>{content}</span>;

  // If content is empty, find the first artifact
  for (const step of data.metadata?.steps ?? []) {
    if (step.artifacts?.length) {
      const artifact = step.artifacts[0];
      return (
        <span className={cn('flex items-center', className)}>
          {getArtifactIcon(artifact, 'w-3 h-3 mr-1')} {artifact.title}
        </span>
      );
    }
  }

  return '';
};
