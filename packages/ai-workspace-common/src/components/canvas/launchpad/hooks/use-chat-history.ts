import { useEffect } from 'react';
import { ActionResult } from '@refly/openapi-schema';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useLaunchpadStoreShallow } from '@refly-packages/ai-workspace-common/stores/launchpad';
import { useActionResultStore } from '@refly-packages/ai-workspace-common/stores/action-result';
import { actionEmitter } from '@refly-packages/ai-workspace-common/events/action';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

export const useChatHistory = () => {
  // Get chat history state and actions
  const { chatHistoryOpen, setChatHistoryOpen } = useLaunchpadStoreShallow((state) => ({
    chatHistoryOpen: state.chatHistoryOpen,
    setChatHistoryOpen: state.setChatHistoryOpen,
  }));

  const { selectedResultItems, setResultItems, updateResultItem, removeResultItem, clearResultItems } =
    useContextPanelStoreShallow((state) => ({
      selectedResultItems: state.selectedResultItems,
      setResultItems: state.setResultItems,
      updateResultItem: state.updateResultItem,
      removeResultItem: state.removeResultItem,
      clearResultItems: state.clearResultItems,
    }));

  // Handle result updates
  useEffect(() => {
    const handleResultUpdate = (payload: { resultId: string; payload: ActionResult }) => {
      const { selectedResultItems } = useContextPanelStore.getState();
      const index = selectedResultItems?.findIndex((item) => item?.resultId === payload?.resultId);
      if (index >= 0) {
        updateResultItem({ ...selectedResultItems[index], ...payload.payload });
      }
    };

    actionEmitter.on('updateResult', handleResultUpdate);
    return () => {
      actionEmitter.off('updateResult', handleResultUpdate);
    };
  }, []);

  const { nodes, setSelectedNodeByEntity } = useCanvasControl();
  const selectedResultNodes = nodes?.filter((node) => node?.selected && node?.type === 'skillResponse');

  // Sync nodes with history items
  useEffect(() => {
    const { selectedResultItems } = useContextPanelStore.getState();
    const { resultMap } = useActionResultStore.getState();

    const newResultItems = [
      ...(selectedResultNodes
        ?.filter(
          (node) => !selectedResultItems?.some((item) => !item?.isPreview && item?.resultId === node?.data?.entityId),
        )
        ?.map((node) => ({ ...resultMap[node?.data?.entityId], isPreview: true })) ?? []),
      ...(selectedResultItems?.filter((item) => !item?.isPreview) ?? []),
    ];

    setResultItems(newResultItems);
  }, [JSON.stringify(selectedResultNodes?.map((node) => node?.id))]);

  const handleItemClick = (resultId: string) => {
    setSelectedNodeByEntity({ type: 'skillResponse', entityId: resultId });
  };

  const handleItemPin = (item: ActionResult & { isPreview?: boolean }) => {
    updateResultItem({ ...item, isPreview: !item?.isPreview });
  };

  const handleItemDelete = (resultId: string) => {
    removeResultItem(resultId);
  };

  return {
    chatHistoryOpen,
    setChatHistoryOpen,
    selectedResultItems,
    clearResultItems,
    handleItemClick,
    handleItemPin,
    handleItemDelete,
  };
};
