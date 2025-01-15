import { useCallback, useRef, useEffect } from 'react';
import {
  useActionResultStore,
  useActionResultStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/action-result';
import { ActionResultNotFoundError } from '@refly/errors';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

const POLLING_INTERVAL = 3000;
const TIMEOUT_DURATION = 10000;
const MAX_NOT_FOUND_RETRIES = 3;

export const useActionPolling = () => {
  const {
    updateActionResult,
    startPolling: startPollingState,
    stopPolling: stopPollingState,
    incrementErrorCount,
    resetErrorCount,
    updateLastPollTime,
    startTimeout,
    updateLastEventTime,
    clearTimeout: clearTimeoutState,
  } = useActionResultStoreShallow((state) => ({
    updateActionResult: state.updateActionResult,
    startPolling: state.startPolling,
    stopPolling: state.stopPolling,
    incrementErrorCount: state.incrementErrorCount,
    resetErrorCount: state.resetErrorCount,
    updateLastPollTime: state.updateLastPollTime,
    startTimeout: state.startTimeout,
    updateLastEventTime: state.updateLastEventTime,
    clearTimeout: state.clearTimeout,
  }));

  const pollingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const stopPolling = useCallback(
    (resultId: string) => {
      stopPollingState(resultId);
      if (pollingTimeoutsRef.current[resultId]) {
        clearTimeout(pollingTimeoutsRef.current[resultId]);
        delete pollingTimeoutsRef.current[resultId];
      }
    },
    [stopPollingState],
  );

  const pollActionResult = useCallback(
    async (resultId: string, version: number) => {
      const { pollingStateMap, resultMap } = useActionResultStore.getState();
      const pollingState = pollingStateMap[resultId];

      if (!pollingState?.isPolling) {
        return;
      }

      try {
        const { data: result } = await getClient().getActionResult({
          query: { resultId, version },
        });

        if (!result.success) {
          if (result.errCode === new ActionResultNotFoundError().code) {
            incrementErrorCount(resultId);
            const newErrorCount = (pollingStateMap[resultId]?.notFoundErrorCount ?? 0) + 1;

            if (newErrorCount >= MAX_NOT_FOUND_RETRIES) {
              stopPolling(resultId);
              const currentResult = resultMap[resultId];
              updateActionResult(resultId, {
                ...currentResult,
                status: 'failed',
                errors: ['Action result not found after 3 retries'],
              });
              return;
            }
          } else {
            stopPolling(resultId);
            return;
          }
        } else {
          resetErrorCount(resultId);

          const status = result.data?.status;

          if (status === 'finish' || status === 'failed') {
            updateActionResult(resultId, result.data);
            stopPolling(resultId);
            return;
          }
        }

        updateLastPollTime(resultId);
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on network errors, let it retry
      }

      // Schedule next poll if still polling
      if (pollingStateMap[resultId]?.isPolling) {
        pollingTimeoutsRef.current[resultId] = setTimeout(() => {
          pollActionResult(resultId, version);
        }, POLLING_INTERVAL);
      }
    },
    [incrementErrorCount, resetErrorCount, stopPolling, updateActionResult, updateLastPollTime],
  );

  const startPolling = useCallback(
    async (resultId: string, version: number) => {
      const { pollingStateMap } = useActionResultStore.getState();
      const pollingState = pollingStateMap[resultId];

      if (pollingState?.isPolling) {
        console.log('already polling', resultId);
        return;
      }

      clearTimeoutState(resultId);
      startPollingState(resultId, version);
      console.log('start polling', resultId, version);

      // Start the polling cycle
      await pollActionResult(resultId, version);
    },
    [clearTimeoutState, startPollingState, pollActionResult],
  );

  const checkAndRestoreTimeouts = useCallback(() => {
    const { pollingStateMap } = useActionResultStore.getState();
    Object.entries(pollingStateMap).forEach(([resultId, state]) => {
      const { timeoutStartTime, lastEventTime, isPolling } = state;

      // Skip if not in a timeout state or already polling
      if (!timeoutStartTime || !lastEventTime || isPolling) {
        return;
      }

      const result = useActionResultStore.getState().resultMap[resultId];
      if (!result || result.status === 'finish' || result.status === 'failed') {
        clearTimeoutState(resultId);
        return;
      }

      const now = Date.now();
      const timeSinceLastEvent = now - lastEventTime;

      // If more than timeout duration since last event, start polling
      if (timeSinceLastEvent >= TIMEOUT_DURATION) {
        startPolling(resultId, state.version);
        updateActionResult(resultId, {
          ...result,
          status: 'executing',
        });
      } else {
        // Schedule the remaining timeout
        const remainingTime = TIMEOUT_DURATION - timeSinceLastEvent;
        pollingTimeoutsRef.current[resultId] = setTimeout(() => {
          startPolling(resultId, state.version);
          updateActionResult(resultId, {
            ...result,
            status: 'executing',
          });
        }, remainingTime);
      }
    });
  }, [clearTimeoutState, startPolling, updateActionResult]);

  // Restore polling for in-progress actions on mount
  useEffect(() => {
    const { pollingStateMap } = useActionResultStore.getState();
    Object.entries(pollingStateMap).forEach(([resultId, state]) => {
      if (state.isPolling) {
        const result = useActionResultStore.getState().resultMap[resultId];
        if (result?.status !== 'finish' && result?.status !== 'failed') {
          startPolling(resultId, state.version);
        }
      }
    });
  }, []);

  // Check for pending timeouts on mount
  useEffect(() => {
    checkAndRestoreTimeouts();
  }, [checkAndRestoreTimeouts]);

  // Cleanup all polling on unmount
  useEffect(() => {
    return () => {
      Object.keys(pollingTimeoutsRef.current).forEach(stopPolling);
    };
  }, [stopPolling]);

  const createTimeoutHandler = useCallback(
    (resultId: string, version: number) => {
      let timeoutId: NodeJS.Timeout;

      const resetTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        updateLastEventTime(resultId);

        timeoutId = setTimeout(() => {
          const result = useActionResultStore.getState().resultMap[resultId];
          if (result?.status !== 'finish' && result?.status !== 'failed') {
            console.log('start polling', resultId, result);
            startPolling(resultId, version);
          }
        }, TIMEOUT_DURATION);
      };

      // Initialize timeout tracking
      startTimeout(resultId);
      resetTimeout();

      return {
        resetTimeout,
        cleanup: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          clearTimeoutState(resultId);
          stopPolling(resultId);
        },
      };
    },
    [startTimeout, updateLastEventTime, startPolling, updateActionResult, clearTimeoutState, stopPolling],
  );

  return {
    startPolling,
    stopPolling,
    createTimeoutHandler,
  };
};
