import { useEffect, memo, useCallback, useMemo } from 'react';

import { ChatPanel } from './chat-panel';
import { SkillDisplay } from './skill-display';
import { cn } from '@refly-packages/utils/cn';

// stores
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';

// types
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { RecommendQuestionsPanel } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/recommend-questions-panel';

interface LaunchPadProps {
  visible?: boolean;
  inReflyPilot?: boolean;
  className?: string;
  parentResultId?: string;
}

export const LaunchPad = memo(
  ({ visible = true, inReflyPilot = false, className, parentResultId }: LaunchPadProps) => {
    // stores
    const contextPanelStore = useContextPanelStoreShallow((state) => ({
      resetState: state.resetState,
    }));
    const chatStore = useChatStoreShallow((state) => ({
      newQAText: state.newQAText,
      setNewQAText: state.setNewQAText,
      resetState: state.resetState,
    }));

    const { canvasId } = useCanvasContext();

    const { recommendQuestionsOpen, setRecommendQuestionsOpen } = useLaunchpadStoreShallow(
      (state) => ({
        recommendQuestionsOpen: state.recommendQuestionsOpen,
        setRecommendQuestionsOpen: state.setRecommendQuestionsOpen,
      }),
    );

    // Add new method to clear state
    const clearLaunchpadState = useCallback(() => {
      chatStore.resetState();
      contextPanelStore.resetState();
    }, [chatStore.resetState, contextPanelStore.resetState]);

    // Handle canvas ID changes
    useEffect(() => {
      if (canvasId) {
        clearLaunchpadState();
      }
    }, [canvasId, clearLaunchpadState]);

    // Memoize the ChatPanel component to prevent unnecessary re-renders
    const chatPanelComponent = useMemo(() => {
      return <ChatPanel embeddedMode={inReflyPilot} parentResultId={parentResultId} />;
    }, [inReflyPilot, parentResultId]);

    if (!visible) {
      return null;
    }

    return (
      <div
        className={cn(
          'ai-copilot-operation-container',
          inReflyPilot && 'embedded-launchpad w-full',
          className,
        )}
        data-cy="launchpad"
      >
        <div className={cn('ai-copilot-operation-body', inReflyPilot && 'p-4')}>
          <SkillDisplay />
          <RecommendQuestionsPanel
            isOpen={recommendQuestionsOpen}
            onClose={() => setRecommendQuestionsOpen(false)}
          />
          {chatPanelComponent}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.visible === nextProps.visible &&
    prevProps.inReflyPilot === nextProps.inReflyPilot &&
    prevProps.parentResultId === nextProps.parentResultId,
);
