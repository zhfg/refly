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
  const [contextCardHeight, setContextCardHeight] = useState(104);
  const searchStateStore = useSearchStateStore();
  const chatStore = useChatStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const noteStore = useNoteStore();

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const noteId = queryParams.get('noteId');
  const currentSelectedMark = knowledgeBaseStore?.currentSelectedMark;

  // 优先级: text > resource > knowledgeBase > all
  const showContextState = !!resId || !!kbId || !!currentSelectedMark || !!noteId;

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;
  const currentNote = noteStore.currentNote;

  // 是否有内容正在选中
  const showSelectedMark = !!currentSelectedMark;

  // 是否展示 contextCard
  const showContextCard = knowledgeBaseStore.showContextCard;
  const contextDomain = knowledgeBaseStore.contextDomain;

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
  }, [showContextCard]);

  return {
    showContextCard,
    contextDomain,
    showContextState,
    showRelatedQuestions,
    showSelectedMark,
    currentResource,
    currentNote,
    currentKnowledgeBase,
    currentSelectedMark,
    contextCardHeight,
  };
};
