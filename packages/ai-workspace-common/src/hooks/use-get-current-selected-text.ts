import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { Mark } from '@refly/common-types';

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
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== 'resource');
    }

    if (!selectedTextCardDomain.includes('canvas')) {
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== 'canvas');
    }

    if (!selectedTextCardDomain.includes('extensionWeblink')) {
      finalUsedMarks = finalUsedMarks.filter((mark) => mark.domain !== 'extensionWeblink');
    }

    // final handle note cursor selection
    if (selectedTextCardDomain.includes('canvasCursorSelection') && currentSelectionContent) {
      finalUsedMarks.push({
        type: 'canvasSelection',
        data: currentSelectionContent,
        xPath: '',
        scope: 'block',
        domain: 'canvasCursorSelection',
      });
    }
    if (selectedTextCardDomain.includes('noteBeforeCursorSelection') && beforeSelectionNoteContent) {
      finalUsedMarks.push({
        type: 'canvasSelection',
        data: beforeSelectionNoteContent,
        xPath: '',
        scope: 'block',
        domain: 'canvasBeforeCursorSelection',
      });
    }
    if (selectedTextCardDomain.includes('noteAfterCursorSelection') && afterSelectionNoteContent) {
      finalUsedMarks.push({
        type: 'canvasSelection',
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
