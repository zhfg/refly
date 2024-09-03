import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { ChatMessage } from '@refly/openapi-schema';
import { useEffect, useState } from 'react';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

const checkShowRelatedQuestion = (messsages: ChatMessage[] = []) => {
  const message = messsages?.[messsages.length - 1];
  if (!message) return false;

  if (message?.type === 'ai' && (message?.relatedQuestions || [])?.length > 0) return true;

  return false;
};

export const useCopilotContextState = () => {
  const [contextCardHeight, setContextCardHeight] = useState(104);
  const chatStore = useChatStore((state) => ({
    messages: state.messages,
  }));
  const contextPanelStore = useContextPanelStore((state) => ({
    showContextCard: state.showContextCard,
    contextDomain: state.contextDomain,
    currentSelectedMark: state.currentSelectedMark,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    currentKnowledgeBase: state.currentKnowledgeBase,
    currentResource: state.currentResource,
    resourcePanelVisible: state.resourcePanelVisible,
  }));
  const noteStore = useNoteStore((state) => ({
    currentNote: state.currentNote,
    notePanelVisible: state.notePanelVisible,
  }));

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const noteId = queryParams.get('noteId');
  const currentSelectedMark = contextPanelStore?.currentSelectedMark;

  // 优先级: text > resource > knowledgeBase > all
  const showContextState = !!resId || !!kbId || !!currentSelectedMark || !!noteId;

  const currentResource = knowledgeBaseStore.currentResource;
  const currentKnowledgeBase = knowledgeBaseStore.currentKnowledgeBase;
  const currentNote = noteStore.currentNote;

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
    currentNote,
    currentKnowledgeBase,
    currentSelectedMark,
    contextCardHeight,
  };
};
