import { useCallback, useEffect, useState } from 'react';
import { convertMarkToNode } from '../utils/mark-to-node';
import { SelectedTextDomain } from '@refly/common-types';
import { genUniqueId } from '@refly-packages/utils/id';
import { useContextPanelStore } from '../stores/context-panel';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { getSelectionNodesMarkdown } from '@refly-packages/ai-workspace-common/modules/content-selector/utils/highlight-selection';

interface UseSelectionContextProps {
  containerClass?: string;
  enabled?: boolean;
}

export const useSelectionContext = ({ containerClass, enabled = true }: UseSelectionContextProps) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const { addContextItem } = useContextPanelStore();

  // Handle text selection
  const handleSelection = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    const container = containerClass ? document.querySelector(`.${containerClass}`) : document.body;

    if (!selection || !container) return;

    const range = selection.getRangeAt(0);
    const text = getSelectionNodesMarkdown();

    if (!text || selection.isCollapsed) {
      setIsSelecting(false);
      setSelectedText('');
      return;
    }

    // Check if selection is within the target container
    if (!container.contains(range.commonAncestorContainer)) {
      setIsSelecting(false);
      setSelectedText('');
      return;
    }

    setSelectedText(text);
    setIsSelecting(true);
  }, [containerClass, enabled]);

  // Add selected text to context
  const addToContext = useCallback(
    (node: CanvasNode) => {
      if (!selectedText) return;

      addContextItem(node);

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setIsSelecting(false);
    },
    [selectedText, addContextItem],
  );

  // Setup event listeners
  useEffect(() => {
    if (!enabled) {
      setIsSelecting(false);
      setSelectedText('');
      return;
    }

    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [enabled, handleSelection]);

  return {
    selectedText,
    isSelecting,
    addToContext,
  };
};
