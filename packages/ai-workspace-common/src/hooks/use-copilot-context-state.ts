import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { ChatMessage } from '@refly/openapi-schema';
import { useEffect, useState } from 'react';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';

const checkShowRelatedQuestion = (messsages: ChatMessage[] = []) => {
  const message = messsages?.[messsages.length - 1];
  if (!message) return false;

  if (message?.type === 'ai' && (message?.relatedQuestions || [])?.length > 0) return true;

  return false;
};

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(68);
  const searchStateStore = useSearchStateStore();
  const chatStore = useChatStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const noteStore = useNoteStore();

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const currentSelectedText = knowledgeBaseStore?.currentSelectedText;

  // 优先级: text > resource > knowledgeBase > all
  const showContextState = !!resId || !!kbId || !!currentSelectedText;
  const isCurrentSelectedText = !!currentSelectedText;
  const isCurrentPageSelected = searchStateStore?.searchTarget === SearchTarget.CurrentPage && !isCurrentSelectedText;
  const isCurrentKnowledgeBaseSelected =
    searchStateStore?.searchTarget === SearchTarget.CurrentKnowledgeBase && !isCurrentSelectedText;

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;
  const currentNote = noteStore.currentNote;

  const showResourceContext = showContextState && isCurrentPageSelected;
  const showKnowledgeBaseContext = showContextState && isCurrentKnowledgeBaseSelected;
  const showSelectedTextContext = showContextState && isCurrentSelectedText;

  const showContextCard = showResourceContext || showKnowledgeBaseContext || showSelectedTextContext;

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
  }, [showResourceContext, showKnowledgeBaseContext, showSelectedTextContext]);

  return {
    showContextCard,
    showContextState,
    showResourceContext,
    showRelatedQuestions,
    showKnowledgeBaseContext,
    showSelectedTextContext,
    currentResource,
    currentNote,
    currentKnowledgeBase,
    currentSelectedText,
    contextCardHeight,
  };
};
