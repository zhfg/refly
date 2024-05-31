import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { Message, MessageType, ServerMessage } from '@refly-packages/ai-workspace-common/types';
import { mapToServerMessage } from '@refly-packages/ai-workspace-common/utils/message';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useListenToSelection } from './use-listen-to-selection';

const checkShowRelatedQuestion = (messsages: ServerMessage[] = []) => {
  const message = messsages?.[messsages.length - 1];
  if (!message) return false;

  if (message?.type === MessageType.Assistant && (message?.relatedQuestions || [])?.length > 0) return true;

  return false;
};

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(80);
  const searchStateStore = useSearchStateStore();
  const chatStore = useChatStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const currentSelectedText = knowledgeBaseStore?.currentSelectedText;

  console.log('currentSelectedText', currentSelectedText);

  // 优先级: text > resource > knowledgeBase > all
  const showContextState = !!resId || !!kbId || !!currentSelectedText;
  const isCurrentSelectedText = !!currentSelectedText;
  const isCurrentPageSelected = searchStateStore?.searchTarget === SearchTarget.CurrentPage && !isCurrentSelectedText;
  const isCurrentKnowledgeBaseSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentKnowledgeBase && !isCurrentSelectedText;

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;

  const showResourceContext = showContextState && isCurrentPageSelected;
  const showKnowledgeBaseContext = showContextState && isCurrentKnowledgeBaseSelected;
  const showSelectedTextContext = showContextState && isCurrentSelectedText;

  const showContextCard = showResourceContext || showKnowledgeBaseContext || showSelectedTextContext;

  // 是否展示 related questions
  const showRelatedQuestions = checkShowRelatedQuestion(mapToServerMessage(chatStore?.messages));

  const calcContextCardHeight = () => {
    const elem = document.querySelector('.ai-copilot-context-state-display-container');
    const height = elem?.clientHeight || 0;
    setContextCardHeight(height);
  };

  useEffect(() => {
    calcContextCardHeight();
  }, [showResourceContext, showKnowledgeBaseContext, showSelectedTextContext]);

  return {
    showContextCard,
    showContextState,
    showResourceContext,
    showRelatedQuestions,
    showKnowledgeBaseContext,
    showSelectedTextContext,
    currentResource,
    currentKnowledgeBase,
    currentSelectedText,
    contextCardHeight,
  };
};
