import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { SelectedTextDomain } from '@refly/common-types';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { Mark } from '@refly/common-types';
import { useEffect, useRef } from 'react';

export const useListenToSelection = (selector: string, domain: SelectedTextDomain) => {
  const mouseUpTimerRef = useRef<number>();
  const mouseDownTimerRef = useRef<number>();
  const contextPanelStore = useContextPanelStore((state) => ({
    currentSelectedMark: state.currentSelectedMark,
    currentSelectedMarks: state.currentSelectedMarks,
    enableMultiSelect: state.enableMultiSelect,
    updateCurrentSelectedMark: state.updateCurrentSelectedMark,
    updateCurrentSelectedMarks: state.updateCurrentSelectedMarks,
    updateSelectedDomain: state.updateSelectedDomain,
  }));
  const searchStateStore = useSearchStateStore();

  const timerForMouseEvent = () => {
    const { enableMultiSelect, currentSelectedMarks } = useContextPanelStore.getState();
    const selection = window.getSelection();
    const text = selection?.toString();

    if (text && text?.trim()?.length > 0) {
      const mark = { type: 'text', data: text } as Mark;
      contextPanelStore.updateCurrentSelectedMark(mark);
      contextPanelStore.updateSelectedDomain(domain);
      searchStateStore.setSearchTarget(SearchTarget.CurrentPage);

      if (enableMultiSelect) {
        contextPanelStore.updateCurrentSelectedMarks(currentSelectedMarks.concat(mark));
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
