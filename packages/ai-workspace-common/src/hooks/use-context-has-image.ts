import { useMemo } from 'react';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';

const useContextHasImage = () => {
  const { contextItems } = useContextPanelStoreShallow((state) => ({
    contextItems: state.contextItems,
  }));

  const isContextIncludeImage = useMemo(() => {
    return contextItems?.some((item) => item.type === 'image');
  }, [contextItems]);

  return isContextIncludeImage;
};

export default useContextHasImage;
