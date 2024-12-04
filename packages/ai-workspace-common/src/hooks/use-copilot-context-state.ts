import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { ChatMessage } from '@refly/openapi-schema';
import { useEffect, useState } from 'react';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';

const checkShowRelatedQuestion = (messsages: ChatMessage[] = []) => {
  const message = messsages?.[messsages.length - 1];
  if (!message) return false;

  if (message?.type === 'ai' && (message?.relatedQuestions || [])?.length > 0) return true;

  return false;
};

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(144);
  const chatStore = useChatStoreShallow((state) => ({
    messages: state.messages,
  }));
  const contextPanelStore = useContextPanelStoreShallow((state) => ({
    showContextCard: state.showContextCard,
    contextDomain: state.contextDomain,
    currentSelectedMark: state.currentSelectedMark,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    currentKnowledgeBase: state.currentKnowledgeBase,
    currentResource: state.currentResource,
    resourcePanelVisible: state.resourcePanelVisible,
  }));
  const canvasStore = useDocumentStoreShallow((state) => ({
    currentCanvas: state.currentCanvas,
  }));

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const canvasId = queryParams.get('noteId');
  const currentSelectedMark = contextPanelStore?.currentSelectedMark;

  // 优先级: text > resource > knowledgeBase > all
  const showContextState = !!resId || !!kbId || !!currentSelectedMark || !!canvasId;

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;
  const currentCanvas = canvasStore.currentCanvas;

  // 是否有内容正在选中
  const showSelectedMark = !!currentSelectedMark;

  // const getShowContextCard = () => {
  //   if (!knowledgeBaseStore.showContextCard) return false;
  //   if (!knowledgeBaseStore.resourcePanelVisible && !noteStore.notePanelVisible) return false;

  //   return true;
  // };

  // 是否展示 contextCard
  const computedShowContextCard = contextPanelStore.showContextCard;
  const contextDomain = contextPanelStore.contextDomain;

  // 是否展示 related questions
  const showRelatedQuestions = checkShowRelatedQuestion(chatStore?.messages);

  const calcContextCardHeight = () => {
    const container = getPopupContainer();
    const elem = container?.querySelector('.ai-copilot-context-state-display-container');
    const height = elem?.clientHeight || 0;
    setContextCardHeight(height);
  };

  useEffect(() => {
    calcContextCardHeight();
  }, [computedShowContextCard]);

  return {
    computedShowContextCard,
    contextDomain,
    showContextState,
    showRelatedQuestions,
    showSelectedMark,
    currentResource,
    currentCanvas,
    currentKnowledgeBase,
    currentSelectedMark,
    contextCardHeight,
  };
};
