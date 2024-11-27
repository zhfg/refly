import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { Mark, SelectedTextDomain } from '@refly/common-types';

export const useGetCurrentSelectedMark = () => {
  const { currentSelectedMark } = useCopilotContextState();
  const contextPanelStore = useContextPanelStore((state) => ({
    enableMultiSelect: state.enableMultiSelect,
    currentSelectedMarks: state.currentSelectedMarks,
    selectedTextCardDomain: state.selectedTextCardDomain,
    beforeSelectionNoteContent: state.beforeSelectionNoteContent,
    afterSelectionNoteContent: state.afterSelectionNoteContent,
    currentSelectionContent: state.currentSelectionContent,
  }));
  const { enableMultiSelect } = contextPanelStore;

  const getFinalUsedMarks = (contextPanelStore) => {
    const {
      currentSelectedMarks = [],
      beforeSelectionNoteContent,
      afterSelectionNoteContent,
      currentSelectionContent,
      selectedTextCardDomain,
    } = contextPanelStore;
    let finalUsedMarks: Mark[] = currentSelectedMarks;

    // stay order
    if (!selectedTextCardDomain.includes('resource')) {
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== ('resource' as SelectedTextDomain));
    }

    if (!selectedTextCardDomain.includes('document')) {
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== ('document' as SelectedTextDomain));
    }

    if (!selectedTextCardDomain.includes('extensionWeblink')) {
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== ('extensionWeblink' as SelectedTextDomain));
    }

    // final handle note cursor selection
    if (selectedTextCardDomain.includes('documentCursorSelection') && currentSelectionContent) {
      finalUsedMarks.push({
        type: 'documentSelection',
        data: currentSelectionContent,
        xPath: '',
        scope: 'block',
        domain: 'documentCursorSelection',
      });
    }
    if (selectedTextCardDomain.includes('noteBeforeCursorSelection') && beforeSelectionNoteContent) {
      finalUsedMarks.push({
        type: 'documentSelection',
        data: beforeSelectionNoteContent,
        xPath: '',
        scope: 'block',
        domain: 'canvasBeforeCursorSelection',
      });
    }
    if (selectedTextCardDomain.includes('noteAfterCursorSelection') && afterSelectionNoteContent) {
      finalUsedMarks.push({
        type: 'documentSelection',
        data: afterSelectionNoteContent,
        xPath: '',
        scope: 'block',
        domain: 'canvasAfterCursorSelection',
      });
    }

    return finalUsedMarks;
  };
  const finalUsedMarks = getFinalUsedMarks(contextPanelStore);

  const hasSelectedTextCardContent = currentSelectedMark || (enableMultiSelect && finalUsedMarks?.length > 0);

  return {
    hasSelectedTextCardContent,
    currentSelectedMark,
    finalUsedMarks,
    getFinalUsedMarks,
  };
};
