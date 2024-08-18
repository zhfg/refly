import { SelectedNamespace, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { Mark } from '@refly/common-types';
import { useEffect, useRef } from 'react';

export const useListenToSelection = (selector: string, namespace: SelectedNamespace) => {
  const mouseUpTimerRef = useRef<number>();
  const mouseDownTimerRef = useRef<number>();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const searchStateStore = useSearchStateStore();

  const timerForMouseEvent = () => {
    const { enableMultiSelect, currentSelectedMarks } = useKnowledgeBaseStore.getState();
    const selection = window.getSelection();
    const text = selection?.toString();

    if (text && text?.trim()?.length > 0) {
      const mark = { type: 'text', data: text } as Mark;
      knowledgeBaseStore.updateCurrentSelectedMark(mark);
      knowledgeBaseStore.updateSelectedNamespace(namespace);
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage);

      if (enableMultiSelect) {
        knowledgeBaseStore.updateCurrentSelectedMarks(currentSelectedMarks.concat(mark));
      }
    }
  };

  const handleMouseUp = () => {
    mouseUpTimerRef.current = window.setTimeout(timerForMouseEvent);
  };

  const handleMouseDown = () => {
    mouseDownTimerRef.current = window.setTimeout(timerForMouseEvent);
  };

  const handleListenToSelection = () => {
    const divElement = document.querySelector(`.${selector}`) as HTMLElement;

    divElement.addEventListener('mousedown', handleMouseDown);
    divElement.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    handleListenToSelection();

    return () => {
      const divElement = document.querySelector(`.${selector}`) as HTMLElement;
      divElement?.removeEventListener('mousedown', handleMouseDown);
      divElement?.removeEventListener('mouseup', handleMouseUp);
      clearTimeout(mouseDownTimerRef.current);
      clearTimeout(mouseUpTimerRef.current);
    };
  }, []);
};
