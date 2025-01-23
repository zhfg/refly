import { useState, memo } from 'react';
import { DocumentEditor } from '@refly-packages/ai-workspace-common/components/document';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface DocumentNodePreviewProps {
  nodeData?: {
    entityId?: string;
    entityType?: 'document' | 'resource';
    node: CanvasNode<any>;
  };
}

export const DocumentNodePreview = memo(
  ({ nodeData }: DocumentNodePreviewProps) => {
    // Get deck size from references store
    const [deckSize, setDeckSize] = useState<number>(0);

    // Early return if no node data
    if (!nodeData?.entityId || !nodeData?.entityType) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          No document data available
        </div>
      );
    }

    const { entityId, entityType, node } = nodeData;

    return (
      <div className="h-full overflow-hidden">
        <DocumentEditor
          docId={entityId}
          deckSize={deckSize}
          setDeckSize={setDeckSize}
          node={node}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.nodeData?.entityId === nextProps.nodeData?.entityId;
  },
);
