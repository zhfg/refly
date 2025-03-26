import { memo } from 'react';
import {
  CanvasNode,
  ResponseNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { ReflyPilot } from '@refly-packages/ai-workspace-common/components/canvas/refly-pilot';
import { cn } from '@refly-packages/utils/cn';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

interface EnhancedSkillResponseProps {
  node: CanvasNode<ResponseNodeMeta>;
  resultId: string;
  className?: string;
}

export const EnhancedSkillResponse = memo(
  ({ node, resultId, className }: EnhancedSkillResponseProps) => {
    const { getReflyPilotMessagesByResultId } = useCanvasStoreShallow((state) => ({
      getReflyPilotMessagesByResultId: state.getReflyPilotMessagesByResultId,
    }));

    // Initialize messages from resultId
    const reflyPilotMessages = getReflyPilotMessagesByResultId(resultId);
    console.log('reflyPilotMessages', reflyPilotMessages);

    return (
      <div className={cn('flex flex-col h-full w-full', className)}>
        <div className="flex flex-1 overflow-hidden">
          <ReflyPilot
            resultId={resultId}
            node={node}
            standalone={false}
            className="h-full w-full"
            initialMessages={reflyPilotMessages}
            useResultIdMapping={true}
          />
        </div>
      </div>
    );
  },
);
