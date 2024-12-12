import { useCallback, useEffect, useState } from 'react';
import { convertMarkToNode } from '../../utils/mark-to-node';
import { SelectedTextDomain } from '@refly/common-types';
import { genUniqueId } from '@refly-packages/utils/id';
import { useContextPanelStore } from '../../stores/context-panel';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';
import { getSelectionNodesMarkdown } from '@refly-packages/ai-workspace-common/modules/content-selector/utils/highlight-selection';

interface UseSelectionContextProps {
  containerClass?: string;
  containerRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

export const useSelectionContext = ({ containerClass, containerRef, enabled = true }: UseSelectionContextProps) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const { addContextItem } = useContextPanelStore();

  const handleSelection = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setIsSelecting(false);
      setSelectedText('');
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const text = getSelectionNodesMarkdown();

      if (!text || selection.isCollapsed) {
        setIsSelecting(false);
        setSelectedText('');
        return;
      }

      // 优先使用 ref 检查容器
      const container =
        containerRef?.current || (containerClass ? document.querySelector(`.${containerClass}`) : document.body);

      if (!container || !container.contains(range.commonAncestorContainer)) {
        setIsSelecting(false);
        setSelectedText('');
        return;
      }

      setSelectedText(text);
      setIsSelecting(true);
    } catch (error) {
      console.error('Selection error:', error);
      setIsSelecting(false);
      setSelectedText('');
    }
  }, [containerClass, containerRef, enabled]);

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
