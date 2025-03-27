import { memo, useCallback, useEffect, useMemo, useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { cn } from '@refly-packages/utils/cn';
import {
  IconClose,
  IconExpand,
  IconShrink,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { RefreshCw } from 'lucide-react';
import { LinearThreadContent, LinearThreadMessage } from './linear-thread';
import { useContextUpdateByResultId } from '@refly-packages/ai-workspace-common/hooks/canvas/use-debounced-context-update';
import { LaunchPad } from '@refly-packages/ai-workspace-common/components/canvas/launchpad';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';

export interface ThreadContainerProps {
  className?: string;
  resultId?: string;
  standalone?: boolean;
  messages: LinearThreadMessage[];
  onAddMessage: (message: { id: string; resultId: string; nodeId: string }) => void;
  onClearMessages: () => void;
  onGenerateMessageIds: () => { resultId: string; nodeId: string };
  onClose?: () => void;
}

const ThreadHeader = memo(
  ({
    onClose,
    onMaximize,
    isMaximized,
    onClearConversation,
  }: {
    onClose: () => void;
    onMaximize: () => void;
    isMaximized: boolean;
    onClearConversation: () => void;
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
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            className="flex items-center text-gray-600 h-7 px-2"
            onClick={onClearConversation}
            icon={<RefreshCw className="w-3.5 h-3.5 mr-1" />}
          >
            {t('canvas.reflyPilot.newConversation', { defaultValue: 'New conversation' })}
          </Button>
          <Button
            type="text"
            size="small"
            className="flex items-center justify-center p-0 w-7 h-7 text-gray-400 hover:text-gray-600 min-w-0"
            onClick={onMaximize}
          >
            {isMaximized ? <IconShrink className="w-4 h-4" /> : <IconExpand className="w-4 h-4" />}
          </Button>
          <Button
            type="text"
            size="small"
            className="flex items-center justify-center p-0 w-7 h-7 text-gray-400 hover:text-gray-600 min-w-0"
            onClick={onClose}
          >
            <IconClose className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  },
);

ThreadHeader.displayName = 'ThreadHeader';

export const ThreadContainer = memo(
  forwardRef<HTMLDivElement, ThreadContainerProps>((props, ref) => {
    const {
      className,
      resultId,
      standalone = true,
      messages,
      onAddMessage,
      onClearMessages,
      onGenerateMessageIds,
      onClose,
    } = props;

    const [isMaximized, setIsMaximized] = useState(false);
    const [contentHeight, setContentHeight] = useState('auto');

    // Get context panel store to manage context items
    const { setContextItems } = useContextPanelStoreShallow((state) => ({
      setContextItems: state.setContextItems,
    }));

    const { setNewQAText } = useChatStoreShallow((state) => ({
      setNewQAText: state.setNewQAText,
    }));

    // Use launchpad store for recommend questions state
    const { setRecommendQuestionsOpen } = useLaunchpadStoreShallow((state) => ({
      setRecommendQuestionsOpen: state.setRecommendQuestionsOpen,
    }));

    // Use our custom hook instead of the local implementation
    const { debouncedUpdateContextItems } = useContextUpdateByResultId({
      standalone,
      resultId,
      setContextItems,
    });

    const handleClose = useCallback(() => {
      if (onClose) {
        onClose();
      }
    }, [onClose]);

    const handleMaximize = useCallback(() => {
      setIsMaximized(!isMaximized);
    }, [isMaximized]);

    const handleClearConversation = useCallback(() => {
      // Clear all messages
      onClearMessages();
      // Clear chat input
      setNewQAText('');
      // Close recommend questions panel if open
      setRecommendQuestionsOpen(false);
    }, [onClearMessages, setNewQAText, setRecommendQuestionsOpen]);

    const containerStyles = useMemo(
      () => ({
        width: standalone ? (isMaximized ? '840px' : '420px') : '100%',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column' as const,
        height: standalone ? 'calc(100vh - 72px)' : '100%',
      }),
      [isMaximized, standalone],
    );

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

        if (messages.length === 0) {
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
    }, [messages.length]);

    // Update context when resultId changes or component mounts
    useEffect(() => {
      if (!standalone && resultId) {
        debouncedUpdateContextItems();
      }
    }, [resultId, standalone, debouncedUpdateContextItems]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex-shrink-0 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col',
          className,
        )}
        style={containerStyles}
      >
        {standalone && (
          <ThreadHeader
            onClose={handleClose}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
            onClearConversation={handleClearConversation}
          />
        )}

        <LinearThreadContent messages={messages} contentHeight={contentHeight} />

        <div className="mt-auto border-t border-gray-200">
          <LaunchPad
            visible={true}
            inReflyPilot={true}
            parentResultId={!standalone && resultId ? resultId : undefined}
            onAddMessage={onAddMessage}
            onGenerateMessageIds={onGenerateMessageIds}
            className="w-full"
          />
        </div>
      </div>
    );
  }),
);

ThreadContainer.displayName = 'ThreadContainer';
