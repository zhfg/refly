import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useGetSkills } from '@refly-packages/ai-workspace-common/skills/main-logic/use-get-skills';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getCurrentEnvContext } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/utils';
import { useEffect } from 'react';

export const useGetCurrentEnvContext = () => {
  const { currentCanvas, currentResource, currentKnowledgeBase } = useCopilotContextState();
  const { checkedKeys, nowSelectedContextDomain, setNowSelectedContextDomain } = useContextPanelStore();

  const currentEnvContextKeys = getCurrentEnvContext(checkedKeys, {
    resource: currentResource,
    canvas: currentCanvas,
    collection: currentKnowledgeBase,
  });
  const nowSelectedEnvContext = currentEnvContextKeys.find((item) => item?.key === nowSelectedContextDomain);

  // skill
  const [skills] = useGetSkills();
  const hasContent = currentEnvContextKeys?.length > 0;

  useEffect(() => {
    // 如果没有选中环境上下文，默认选中第一个
    if (currentEnvContextKeys?.length > 0 && !nowSelectedEnvContext) {
      setNowSelectedContextDomain(currentEnvContextKeys[0].key);
    }
  }, [currentEnvContextKeys?.length, nowSelectedEnvContext]);

  return {
    hasContent,
    nowSelectedEnvContext,
    currentEnvContextKeys,
  };
};
