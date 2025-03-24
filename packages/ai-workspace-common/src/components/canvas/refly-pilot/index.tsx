import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { SkillResponseNodePreview } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response';
import { cn } from '@refly-packages/utils/cn';
import {
  IconClose,
  IconExpand,
  IconShrink,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { LaunchPad } from '@refly-packages/ai-workspace-common/components/canvas/launchpad';

interface ReflyPilotProps {
  className?: string;
}

const ReflyPilotHeader = memo(
  ({
    onClose,
    onMaximize,
    isMaximized,
  }: {
    onClose: () => void;
    onMaximize: () => void;
    isMaximized: boolean;
  }) => {
    const { t } = useTranslation();

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500 shadow-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">P</span>
          </div>
          <span className="text-sm font-medium leading-normal">
            {t('canvas.reflyPilot.title', { defaultValue: 'Refly Pilot' })}
          </span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMaximize}
            className="flex items-center justify-center h-6 w-6 text-gray-400 hover:text-gray-600"
          >
            {isMaximized ? <IconShrink className="w-4 h-4" /> : <IconExpand className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-6 w-6 text-gray-400 hover:text-gray-600"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
);

export const ReflyPilot = memo(({ className }: ReflyPilotProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { showReflyPilot, setShowReflyPilot, reflyPilotMessages } = useCanvasStoreShallow(
    (state) => ({
      showReflyPilot: state.showReflyPilot,
      setShowReflyPilot: state.setShowReflyPilot,
      reflyPilotMessages: state.reflyPilotMessages,
    }),
  );

  const handleClose = useCallback(() => {
    setShowReflyPilot(false);
  }, [setShowReflyPilot]);

  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized);
  }, [isMaximized]);

  const containerStyles = useMemo(
    () => ({
      width: isMaximized ? '840px' : '420px',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'calc(100vh - 72px)',
    }),
    [isMaximized],
  );

  // Sort messages by timestamp (newest first)
  const sortedMessages = useMemo(() => {
    return [...reflyPilotMessages].sort((a, b) => b.timestamp - a.timestamp);
  }, [reflyPilotMessages]);

  // Handle window resize and update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      // Calculate available space
      const viewportHeight = window.innerHeight;
      const headerHeight = 52; // Header height
      const launchpadHeight = 180; // Approximate height of launchpad + margins
      const topOffset = 72; // Top offset from viewport

      // Calculate content height
      const availableHeight = viewportHeight - topOffset - headerHeight - launchpadHeight;

      if (sortedMessages.length === 0) {
        setContentHeight('auto');
      } else {
        setContentHeight(`${Math.max(300, availableHeight)}px`);
      }
    };

    // Initial calculation
    updateDimensions();

    // Listen for window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [sortedMessages.length]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesContainerRef.current && sortedMessages.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTop = 0; // Scroll to the top since messages are sorted newest first
    }
  }, [sortedMessages.length]);

  if (!showReflyPilot) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col',
        className,
      )}
      style={containerStyles}
    >
      <ReflyPilotHeader
        onClose={handleClose}
        onMaximize={handleMaximize}
        isMaximized={isMaximized}
      />
      <div
        ref={messagesContainerRef}
        className="flex-grow overflow-auto preview-container"
        style={{ height: contentHeight }}
      >
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {sortedMessages.map((message) => (
              <div key={message.id} className="p-4">
                <SkillResponseNodePreview
                  node={{
                    id: message.id,
                    type: 'skillResponse',
                    position: { x: 0, y: 0 },
                    data: {
                      entityId: message.resultId,
                      title: 'Refly Pilot Response',
                      metadata: {
                        status: 'finish',
                      },
                    },
                  }}
                  resultId={message.resultId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto border-t border-gray-200">
        <LaunchPad visible={true} inReflyPilot={true} />
      </div>
    </div>
  );
});
