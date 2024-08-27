import { useMatch, useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useEffect, useRef } from 'react';
import { onMessage, sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { BackgroundMessage, CopilotMsgName } from '@refly/common-types';

export const useMockInAppResource = () => {
  const messageListenerEventRef = useRef<any>();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();

  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const isKbPage = useMatch('/knowledge-base');
  const isHomepage = useMatch('/');
  /**
   * 在这之前，已经在初始
   */
  const handleFakeKBRouteJump = () => {
    jumpToReadResource({
      resId: 'tempResId',
    });
  };

  const onMessageHandler = (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    const { name } = data || {};

    if (name === 'currentMockResource' && data?.type === 'syncInfo') {
      const { currentMockResource } = data.body;
      if (currentMockResource) {
        knowledgeBaseStore.updateResource(currentMockResource);
      }
    }
  };

  // 初始状态，直接构造虚构的 kbId 和 resId
  useEffect(() => {
    if (!resId && !kbId && isHomepage && knowledgeBaseStore?.currentResource) {
      handleFakeKBRouteJump();
    }
  }, [resId, kbId, knowledgeBaseStore.currentResource]);

  const initMessageListener = () => {
    onMessage(onMessageHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.();
    };
  };

  // initial check refly status
  useEffect(() => {
    sendMessage({
      name: 'reflyStatusCheck',
      type: 'others',
      source: getRuntime(),
    });
  }, []);

  return {
    initMessageListener,
  };
};
