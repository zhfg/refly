import { useMatch, useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useEffect } from 'react';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { handleGetAndWatchValue, useStorage } from '@/hooks/use-storage';
import { Resource } from '@refly/openapi-schema';
import { useExtensionMessage } from '@/hooks/use-extension-message';

export const useMockInAppResource = () => {
  const navigate = useNavigate();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();

  const [pageOnActivated] = useExtensionMessage<{ name: string }>('refly-status-check', (_, { send }) => {
    // send({ name: 'refly-status-check' });
    console.log('pageOnActivated', { name: 'refly-status-check' });
    if (getRuntime() === 'extension-sidepanel') {
      handleGetCurrentMockResource();
    }
  });

  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const isKbPage = useMatch('/knowledge-base');
  const isHomepage = useMatch('/');
  /**
   * 在这之前，已经在初始
   */
  const handleFakeKBRouteJump = () => {
    jumpToReadResource({
      kbId: 'tempKbId',
      resId: 'tempResId',
    });
  };

  // 获取 resources
  const handleGetCurrentMockResource = async () => {
    const runtime = getRuntime();
    const res = (await sendToBackground({
      name: 'getCurrentMockResourceByTabId',
      type: 'others',
      source: runtime,
    })) as { currentMockResource: Resource };

    if (res?.currentMockResource) {
      knowledgeBaseStore.updateResource(res?.currentMockResource);
    }
  };

  // 初始状态，直接构造虚构的 kbId 和 resId
  useEffect(() => {
    if (!resId && !kbId && isHomepage && knowledgeBaseStore?.currentResource) {
      handleFakeKBRouteJump();
    }
  }, [resId, kbId, knowledgeBaseStore.currentResource]);
  useEffect(() => {
    handleGetCurrentMockResource();
  }, []);
};
