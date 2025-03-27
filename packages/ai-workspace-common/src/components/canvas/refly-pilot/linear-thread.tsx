import { memo, useRef, useEffect } from 'react';
import { SkillResponseNodePreview } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response';
import { LinearThreadMessage } from '@refly-packages/ai-workspace-common/stores/canvas';

interface LinearThreadContentProps {
  messages: LinearThreadMessage[];
  contentHeight: string | number;
  className?: string;
}

// Optimize SkillResponseNodePreview with memo
const MemoizedSkillResponseNodePreview = memo(SkillResponseNodePreview, (prevProps, nextProps) => {
  return (
    prevProps.resultId === nextProps.resultId &&
    prevProps.node.data?.entityId === nextProps.node.data?.entityId
  );
});

MemoizedSkillResponseNodePreview.displayName = 'MemoizedSkillResponseNodePreview';

export const LinearThreadContent = memo(
  ({ messages, contentHeight, className = '' }: LinearThreadContentProps) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom effect
    useEffect(() => {
      if (messagesContainerRef.current) {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }, [messages]);

    return (
      <div
        ref={messagesContainerRef}
        className={`flex-grow overflow-auto preview-container ${className}`}
        style={{ height: contentHeight, width: '100%' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {messages.map((message) => (
              <div key={message.id}>
                <MemoizedSkillResponseNodePreview
                  node={{
                    id: message.nodeId,
                    type: 'skillResponse',
                    position: { x: 0, y: 0 },
                    data: message.data,
                  }}
                  resultId={message.resultId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

LinearThreadContent.displayName = 'LinearThreadContent';
