import { useMatch, useNavigate, useSearchParams } from '@refly/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly/ai-workspace-common/stores/knowledge-base';
import { useEffect } from 'react';
import { sendToBackground } from '@refly/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly/ai-workspace-common/utils/env';
import { handleGetAndWatchValue, useStorage } from '@/hooks/use-storage';
import { ResourceDetail } from '@refly/openapi-schema';

export const useMockInAppResource = () => {
  const navigate = useNavigate();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const isKbPage = useMatch('/knowledge-base');
  const isHomepage = useMatch('/');
  /**
   * 在这之前，已经在初始
   */
  const handleFakeKBRouteJump = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('kbId', 'tempKbId');
    newSearchParams.set('resId', 'tempResId');
    setSearchParams(newSearchParams);
    navigate(`/knowledge-base?${newSearchParams.toString()}`);
  };

  // 获取 resources
  const handleGetCurrentMockResource = async () => {
    const runtime = getRuntime();
    const res = (await sendToBackground({
      name: 'getTabId',
      type: 'others',
      source: runtime,
    })) as { tabId: string };

    if (res?.tabId) {
      handleGetAndWatchValue<ResourceDetail>(`${res?.tabId}_currentMockResource`, 'sync', (val) => {
        if (val) {
          knowledgeBaseStore.updateResource(val);
        }
      });
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
